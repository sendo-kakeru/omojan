export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/avif",
] as const;

export type ImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];
