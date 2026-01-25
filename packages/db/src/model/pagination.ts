import {
	array,
	type GenericSchema,
	type InferOutput,
	number,
	object,
	optional,
	pipe,
	rawTransform,
	string,
} from "valibot";

/**
 * 文字列を整数に変換するスキーマ（バリデーション付き）
 */
const stringToInt = (minVal: number, maxVal?: number) =>
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

/**
 * ページネーションクエリパラメータ（リクエスト用）
 *
 * クエリパラメータは文字列として受け取るため、string型で定義
 */
export const paginationRequestQuerySchema = object({
	/** 1ページあたりの件数（default: 20, min: 1, max: 100） */
	limit: optional(stringToInt(1, 100)),
	/** ページ番号（1始まり、default: 1, min: 1） */
	page: optional(stringToInt(1)),
});
export type PaginationQuery = InferOutput<typeof paginationRequestQuerySchema>;

/**
 * ページネーション情報
 */
export const paginationSchema = object({
	/** 1ページあたりの件数 */
	limit: number(),
	/** 現在のページ番号 */
	page: number(),
	/** 総件数 */
	total: number(),
	/** 総ページ数 */
	totalPages: number(),
});
export type Pagination = InferOutput<typeof paginationSchema>;

/**
 * ページネーション付きレスポンスを生成するヘルパー
 *
 * @example
 * const myListResponseSchema = paginatedResponseSchema(myItemSchema);
 * type MyListResponse = InferOutput<typeof myListResponseSchema>;
 */
export function paginatedResponseSchema<T extends GenericSchema>(
	itemSchema: T,
) {
	return object({
		items: array(itemSchema),
		meta: paginationSchema,
	});
}
