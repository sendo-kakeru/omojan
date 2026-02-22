import type { ImageMimeType } from "@repo/shared/constants/image";

/**
 * マジックバイトから画像の MIME タイプを判定する。
 * 対応フォーマット: JPEG, PNG, GIF, WebP, AVIF。
 * 非対応フォーマットの場合は null を返す。
 */
export function detectMime(buffer: ArrayBuffer): ImageMimeType | null {
	const bytes = new Uint8Array(buffer, 0, Math.min(12, buffer.byteLength));

	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return "image/jpeg";
	}

	// PNG: 89 50 4E 47
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47
	) {
		return "image/png";
	}

	// GIF: 47 49 46 38
	if (
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38
	) {
		return "image/gif";
	}

	// WebP: offset 0 "RIFF" (52 49 46 46), offset 8 "WEBP" (57 45 42 50)
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return "image/webp";
	}

	// AVIF: offset 4 "ftypavif" (66 74 79 70 61 76 69 66)
	if (
		bytes[4] === 0x66 &&
		bytes[5] === 0x74 &&
		bytes[6] === 0x79 &&
		bytes[7] === 0x70 &&
		bytes[8] === 0x61 &&
		bytes[9] === 0x76 &&
		bytes[10] === 0x69 &&
		bytes[11] === 0x66
	) {
		return "image/avif";
	}

	return null;
}
