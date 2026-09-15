/**
 * 日付を相対時間形式でフォーマットする
 * @param dateString ISO形式の日付文字列
 * @returns n分前、n時間前、n日前、n週間前、nヶ月前 形式の文字列
 */
export function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);

	if (diffMinutes < 1) {
		return "たった今";
	}
	if (diffMinutes < 60) {
		return `${diffMinutes}分前`;
	}
	if (diffHours < 24) {
		return `${diffHours}時間前`;
	}
	if (diffDays < 7) {
		return `${diffDays}日前`;
	}
	if (diffDays < 30) {
		return `${diffWeeks}週間前`;
	}
	return `${diffMonths}ヶ月前`;
}

/**
 * 日付を yyyy/mm/dd 形式でフォーマットする
 * @param dateString ISO形式の日付文字列
 * @returns yyyy/mm/dd 形式の文字列
 */
export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}/${month}/${day}`;
}

/**
 * 日付を yyyy-mm-dd 形式でフォーマットする
 * @param dateString ISO形式の日付文字列
 * @returns yyyy-mm-dd 形式の文字列
 */
export function formatDateHyphen(dateString: string): string {
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
