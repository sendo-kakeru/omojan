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
};

/** プロフィールページ用リサイズパラメータ (96px × Retina 2x) */
export const PROFILE_IMAGE_DIMENSIONS = { h: 192, w: 192 };

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

	const params = new URLSearchParams();
	params.set("w", String(size.w));
	params.set("h", String(size.h));
	return `${base}?${params.toString()}`;
}
