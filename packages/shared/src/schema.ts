import { email, literal, pipe, rawTransform, string, union } from "valibot";

export const emailSchema = pipe(
	string(),
	email("有効なメールアドレスを入力してください"),
);

/**
 * 文字列を整数に変換するスキーマ（バリデーション付き）
 */
export const stringToInt = (minVal: number, maxVal?: number) =>
	pipe(
		string(),
		rawTransform(({ dataset, addIssue, NEVER }) => {
			const num = Number.parseInt(dataset.value, 10);
			if (Number.isNaN(num)) {
				addIssue({ message: "数値で入力してください" });
				return NEVER;
			}
			if (num < minVal) {
				addIssue({ message: `${minVal}以上で入力してください` });
				return NEVER;
			}
			if (maxVal !== undefined && num > maxVal) {
				addIssue({ message: `${maxVal}以下で入力してください` });
				return NEVER;
			}
			return num;
		}),
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
