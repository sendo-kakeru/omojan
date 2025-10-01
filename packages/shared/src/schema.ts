import { email, minLength, pipe, regex, string } from "valibot";

export const passwordSchema = pipe(
	string(),
	minLength(8, "パスワードは8文字以上である必要があります"),
	regex(/[^A-Za-z0-9]/, "少なくとも1つの特殊文字を含める必要があります"),
	regex(/[A-Z]/, "大文字を1文字以上含める必要があります"),
	regex(/[a-z]/, "小文字を1文字以上含める必要があります"),
	regex(/[0-9]/, "数字を1文字以上含める必要があります"),
);

export const emailSchema = pipe(
	string(),
	email("有効なメールアドレスを入力してください"),
);
