export function hasCode(obj: unknown): obj is { code: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"code" in obj &&
		typeof obj.code === "string"
	);
}

export function hasStatusCode(obj: unknown): obj is { statusCode: number } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"statusCode" in obj &&
		typeof obj.statusCode === "number"
	);
}

export function hasMessage(obj: unknown): obj is { message: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"message" in obj &&
		typeof obj.message === "string"
	);
}

export function hasCause(obj: unknown): obj is { cause: unknown } {
	return (
		typeof obj === "object" && obj !== null && "cause" in obj && !!obj.cause
	);
}

/**
 * パスから最後のセグメント（id想定）を返す
 * - 末尾スラッシュ/クエリ/ハッシュは除外
 */
export function getLastPath(path: string): string | undefined {
	// クエリ/ハッシュ削除 → 末尾スラッシュ削除
	const cleaned = path.split("#")[0]?.split("?")[0]?.replace(/\/+$/, "");

	if (!cleaned) return undefined;

	const index = cleaned.lastIndexOf("/");
	return index === -1 ? cleaned : cleaned.slice(index + 1);
}
