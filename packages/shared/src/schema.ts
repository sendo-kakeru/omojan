import { email, pipe, string } from "valibot";

export const emailSchema = pipe(
	string(),
	email("有効なメールアドレスを入力してください"),
);
