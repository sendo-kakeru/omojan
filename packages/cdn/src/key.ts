import { HTTPException } from "hono/http-exception";

const MAX_KEY_LENGTH = 1024;
const ALLOWED_KEY_PATTERN = /^[a-zA-Z0-9\-_/.]+$/;

export function validateKey(key: string): void {
	if (key === "") {
		throw new HTTPException(400, { message: "キーが空です" });
	}
	if (key.length > MAX_KEY_LENGTH) {
		throw new HTTPException(400, {
			message: `キーが長すぎます: ${key.length}文字 (最大${MAX_KEY_LENGTH}文字)`,
		});
	}
	if (key.startsWith("/")) {
		throw new HTTPException(400, {
			message: "キーの先頭に / は使用できません",
		});
	}
	if (key.includes("..")) {
		throw new HTTPException(400, {
			message: "キーに .. は使用できません",
		});
	}
	if (key.includes("//")) {
		throw new HTTPException(400, {
			message: "キーに // は使用できません",
		});
	}
	if (key.includes("/./") || key.endsWith("/.") || key === ".") {
		throw new HTTPException(400, {
			message: "キーに無効なパスセグメントが含まれています",
		});
	}
	if (!ALLOWED_KEY_PATTERN.test(key)) {
		throw new HTTPException(400, {
			message: "キーに使用できない文字が含まれています",
		});
	}
}
