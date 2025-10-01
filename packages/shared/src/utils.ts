export function hasCode(obj: unknown): obj is { code: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"code" in obj &&
		typeof obj.code === "string"
	);
}
