import { email, literal, pipe, string, union } from "valibot";

export const emailSchema = pipe(
	string(),
	email("有効なメールアドレスを入力してください"),
);

export const envVarSchema = union([
	/**
	 * Localも含む
	 */
	literal("development"),
	literal("staging"),
	literal("production"),
	literal("e2e"),
]);
