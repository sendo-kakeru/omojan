import { stringToInt } from "@repo/shared/schema";
import {
	array,
	type GenericSchema,
	type InferOutput,
	number,
	object,
	optional,
} from "valibot";

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
