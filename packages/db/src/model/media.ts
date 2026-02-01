import {
	array,
	check,
	type InferOutput,
	instance,
	number,
	object,
	pipe,
	string,
	transform,
} from "valibot";

// カンマ区切りの数値をパースするヘルパー
const commaSeparatedNumbers = pipe(
	string(),
	transform((value) =>
		value
			.split(",")
			.map((s) => Number.parseInt(s.trim(), 10))
			.filter((n) => !Number.isNaN(n) && n > 0),
	),
);

// 許可する画像MIMEタイプ
const VALID_IMAGE_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
] as const;

// 画像ファイルのバリデーション
export const imageFileSchema = pipe(
	instance(File),
	check(
		(file) =>
			VALID_IMAGE_TYPES.includes(
				file.type as (typeof VALID_IMAGE_TYPES)[number],
			),
		"画像ファイルのみアップロード可能です（jpeg, png, gif, webp）",
	),
);
export type ImageFile = InferOutput<typeof imageFileSchema>;

// アップロードリクエストクエリ
// width: カンマ区切りの幅 (例: "64,128,256,512")
export const uploadImageRequestQuerySchema = object({
	width: commaSeparatedNumbers,
});
export type UploadImageRequestQuery = InferOutput<
	typeof uploadImageRequestQuerySchema
>;

// アップロードレスポンス（サイズごとの結果）
const uploadedImageInfoSchema = object({
	key: string(),
	size: number(),
	width: number(),
});
export type UploadedImageInfo = InferOutput<typeof uploadedImageInfoSchema>;

// 単一ファイルのアップロードレスポンス（各サイズの結果配列）
export const uploadImageResponseBodySchema = array(uploadedImageInfoSchema);
export type UploadImageResponseBody = InferOutput<
	typeof uploadImageResponseBodySchema
>;
