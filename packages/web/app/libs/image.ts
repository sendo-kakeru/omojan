import {
	ALLOWED_IMAGE_MIME_TYPES,
	MAX_IMAGE_FILE_SIZE,
} from "@repo/shared/constants/image";

/**
 * Avatar サイズ → Retina 2x リサイズパラメータ
 * Tailwind --spacing: 1px 基準: S=24px, M=32px, L=40px → 各2倍
 */
export const AVATAR_IMAGE_DIMENSIONS: Record<
	"S" | "M" | "L",
	{ h: number; w: number }
> = {
	L: { h: 80, w: 80 },
	M: { h: 64, w: 64 },
	S: { h: 48, w: 48 },
} as const;

/** プロフィールページ用リサイズパラメータ (96px × Retina 2x) */
export const PROFILE_IMAGE_DIMENSIONS = { h: 192, w: 192 } as const;

/**
 * 画像キーまたは外部 URL から表示用 URL を構築する。
 * - R2 キー: CDN ドメイン + /images/ プレフィックス + リサイズパラメータ
 * - 外部 URL（LINE 等）: そのまま返す
 * - null/undefined: undefined を返す
 */
export function buildImageUrl({
	image,
	size,
}: {
	image: string | null | undefined;
	size?: { w: number; h: number };
}): string | undefined {
	if (!image) return undefined;

	// 外部 URL はそのまま返す
	if (image.startsWith("http://") || image.startsWith("https://")) {
		return image;
	}

	// R2 キー → CDN URL を構築
	const base = `${import.meta.env.VITE_CDN_URL}/images/${image}`;
	if (!size) return base;

	return `${base}?w=${size.w}&h=${size.h}`;
}

/** クライアント側の画像ファイルバリデーション */
export function validateImageFile(file: File): string | null {
	if (
		!ALLOWED_IMAGE_MIME_TYPES.includes(
			file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
		)
	) {
		return "対応していない画像フォーマットです（JPEG/PNG/GIF/WebP/AVIF のみ）";
	}
	if (file.size > MAX_IMAGE_FILE_SIZE) {
		return "ファイルサイズが10MBを超えています";
	}
	return null;
}
