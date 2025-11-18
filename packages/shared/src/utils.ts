export function hasCode(obj: unknown): obj is { code: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"code" in obj &&
		typeof obj.code === "string"
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
