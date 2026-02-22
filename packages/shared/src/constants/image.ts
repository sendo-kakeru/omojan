export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_DIMENSION_MIN = 1;
export const IMAGE_DIMENSION_MAX = 4000;

export const ALLOWED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
] as const;

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** MIME タイプ → ファイル拡張子マッピング */
export const MIME_TO_EXTENSION: Record<ImageMimeType, string> = {
	"image/avif": "avif",
	"image/gif": "gif",
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
} as const;
