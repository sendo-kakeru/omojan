/** 名前が空のときの表示用の名前 */
const DISPLAY_NAME_FALLBACK = "名無し";

/**
 * 画面に出す名前を返す。空の場合のフォールバックを適応
 */
export function getDisplayName(name: string): string {
	const trimmed = name.trim();
	return trimmed === "" ? DISPLAY_NAME_FALLBACK : trimmed;
}
