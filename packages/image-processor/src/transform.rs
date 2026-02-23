use std::io::Cursor;

use bytes::Bytes;
use exif::{In, Tag};
use fast_image_resize as fr;
use image::codecs::webp::WebPEncoder;
use image::{DynamicImage, ImageReader, Limits};

const MAX_DIMENSION: u32 = 4000;
const MAX_PIXELS: u32 = MAX_DIMENSION * MAX_DIMENSION; // 16,000,000

#[derive(Debug, thiserror::Error)]
pub enum TransformError {
    #[error("failed to decode image: {0}")]
    Decode(String),
    #[error("invalid parameters: {0}")]
    InvalidParams(String),
    #[error("source image too large: {width}x{height} ({pixels} pixels, max {MAX_PIXELS})")]
    SourceTooLarge {
        width: u32,
        height: u32,
        pixels: u32,
    },
    #[error("failed to encode image: {0}")]
    Encode(String),
    #[error("failed to resize image: {0}")]
    Resize(String),
}

pub struct TransformParams {
    pub width: Option<u32>,
    pub height: Option<u32>,
}

impl TransformParams {
    pub fn needs_resize(&self) -> bool {
        self.width.is_some() || self.height.is_some()
    }
}

/// 画像変換のエントリポイント。EXIF回転適用 → バリデーション → リサイズ → WebP エンコードを行う。
pub fn transform(input: &Bytes, params: &TransformParams) -> Result<Bytes, TransformError> {
    validate_params(params)?;

    let orientation = read_exif_orientation(input);
    let image = decode_image(input)?;
    let image = apply_orientation(image, orientation);

    validate_source_dimensions(&image)?;

    let image = if params.needs_resize() {
        let (new_w, new_h) = calculate_contain_dimensions(&image, params);
        resize_image(&image, new_w, new_h)?
    } else {
        image
    };

    encode_webp(&image)
}

/// マジックバイトからフォーマットを推定し、画像バイト列をデコードする。
/// デコーダリミットを設定し、画像爆弾（巨大画像による OOM）を防御する。
fn decode_image(input: &Bytes) -> Result<DynamicImage, TransformError> {
    let mut reader = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .map_err(|e| TransformError::Decode(e.to_string()))?;

    let mut limits = Limits::default();
    limits.max_image_width = Some(MAX_DIMENSION);
    limits.max_image_height = Some(MAX_DIMENSION);
    limits.max_alloc = Some(256 * 1024 * 1024); // 256MB
    reader.limits(limits);

    reader
        .decode()
        .map_err(|e| TransformError::Decode(e.to_string()))
}

/// EXIF Orientation タグを読み取る。失敗時は 1（変換なし）を返す。
fn read_exif_orientation(data: &[u8]) -> u32 {
    let Ok(exif) = exif::Reader::new().read_from_container(&mut Cursor::new(data)) else {
        return 1;
    };
    exif.get_field(Tag::Orientation, In::PRIMARY)
        .and_then(|f| f.value.get_uint(0))
        .unwrap_or(1)
}

/// Orientation 値(1-8)に基づきピクセルを回転・反転する。メタデータは再エンコードで除去される。
fn apply_orientation(img: DynamicImage, orientation: u32) -> DynamicImage {
    match orientation {
        2 => img.fliph(),
        3 => img.rotate180(),
        4 => img.flipv(),
        5 => img.rotate90().fliph(),
        6 => img.rotate90(),
        7 => img.rotate270().fliph(),
        8 => img.rotate270(),
        _ => img,
    }
}

/// ソース画像の総ピクセル数を検証し、メモリ枯渇を防ぐ（上限 4000x4000）。
fn validate_source_dimensions(image: &DynamicImage) -> Result<(), TransformError> {
    let (w, h) = (image.width(), image.height());
    let pixels = w.saturating_mul(h);

    if pixels > MAX_PIXELS {
        return Err(TransformError::SourceTooLarge {
            width: w,
            height: h,
            pixels,
        });
    }
    Ok(())
}

/// w/h パラメータが有効範囲(1-4000)内であることを検証する。
fn validate_params(params: &TransformParams) -> Result<(), TransformError> {
    if let Some(w) = params.width
        && (w == 0 || w > MAX_DIMENSION)
    {
        return Err(TransformError::InvalidParams(format!(
            "width must be 1-{MAX_DIMENSION}, got {w}"
        )));
    }
    if let Some(h) = params.height
        && (h == 0 || h > MAX_DIMENSION)
    {
        return Err(TransformError::InvalidParams(format!(
            "height must be 1-{MAX_DIMENSION}, got {h}"
        )));
    }
    Ok(())
}

/// contain モードで出力サイズを計算する。アスペクト比を維持しバウンディングボックス内に収める。
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn calculate_contain_dimensions(image: &DynamicImage, params: &TransformParams) -> (u32, u32) {
    let (src_w, src_h) = (f64::from(image.width()), f64::from(image.height()));

    match (params.width, params.height) {
        (Some(w), Some(h)) => {
            let scale = (f64::from(w) / src_w).min(f64::from(h) / src_h);
            let new_w = (src_w * scale).round().max(1.0) as u32;
            let new_h = (src_h * scale).round().max(1.0) as u32;
            (new_w, new_h)
        }
        (Some(w), None) => {
            let scale = f64::from(w) / src_w;
            let new_h = (src_h * scale).round().max(1.0) as u32;
            (w, new_h)
        }
        (None, Some(h)) => {
            let scale = f64::from(h) / src_h;
            let new_w = (src_w * scale).round().max(1.0) as u32;
            (new_w, h)
        }
        (None, None) => (image.width(), image.height()),
    }
}

/// Lanczos3 フィルタで RGBA 画像をリサイズする。SIMD 最適化の `fast_image_resize` を使用。
fn resize_image(
    image: &DynamicImage,
    width: u32,
    height: u32,
) -> Result<DynamicImage, TransformError> {
    let src_image = image.to_rgba8();
    let (src_w, src_h) = (src_image.width(), src_image.height());

    let src =
        fr::images::Image::from_vec_u8(src_w, src_h, src_image.into_raw(), fr::PixelType::U8x4)
            .map_err(|e| TransformError::Resize(e.to_string()))?;

    let mut dst = fr::images::Image::new(width, height, fr::PixelType::U8x4);

    let mut resizer = fr::Resizer::new();
    let options =
        fr::ResizeOptions::new().resize_alg(fr::ResizeAlg::Convolution(fr::FilterType::Lanczos3));
    resizer
        .resize(&src, &mut dst, Some(&options))
        .map_err(|e| TransformError::Resize(e.to_string()))?;

    let buffer = dst.into_vec();
    let img_buf = image::RgbaImage::from_raw(width, height, buffer)
        .ok_or_else(|| TransformError::Resize("failed to create image buffer".into()))?;

    Ok(DynamicImage::ImageRgba8(img_buf))
}

/// `DynamicImage` をロスレス WebP にエンコードする。
fn encode_webp(image: &DynamicImage) -> Result<Bytes, TransformError> {
    let mut buf = Cursor::new(Vec::new());
    let encoder = WebPEncoder::new_lossless(&mut buf);
    image
        .write_with_encoder(encoder)
        .map_err(|e| TransformError::Encode(e.to_string()))?;

    Ok(Bytes::from(buf.into_inner()))
}
