import { createSelectSchema } from "drizzle-valibot";
import {
	array,
	type BrandSymbol,
	type InferOutput,
	length,
	literal,
	maxLength,
	maxValue,
	minLength,
	minValue,
	nullable,
	number,
	object,
	omit,
	optional,
	pick,
	pipe,
	string,
	variant,
} from "valibot";
import {
	playerIdSchema,
	playerNameSchema,
	playerSchema,
	playerTable,
	roomIdSchema,
	roomTable,
	roomSchema as roomTableSchema,
	userSchema,
} from "../schema";
export type { BrandSymbol };

export const gamePasswordSchema = pipe(
	string("パスワードを入力してください"),
	length(6, "パスワードは6文字で入力してください"),
);

export const gameSchema = object({
	...pick(roomTableSchema, ["title", "isPrivate", "password", "timeLimit"])
		.entries,
	gameId: roomIdSchema,
	players: array(
		object({
			...pick(playerSchema, ["playerName", "seat"]).entries,
			id: playerIdSchema,
			image: nullable(userSchema.entries.image),
		}),
	),
});
export type Game = InferOutput<typeof gameSchema>;

// find many
export const getGameListResponseBodySchema = array(
	omit(gameSchema, ["password"]),
);
export type GetGameListResponseBody = InferOutput<
	typeof getGameListResponseBodySchema
>;

// find one
export const getGameResponseBodySchema = pick(gameSchema, [
	"title",
	"isPrivate",
	"password",
	"timeLimit",
]);
export type GetGameResponseBody = InferOutput<typeof getGameResponseBodySchema>;

// join
export const joinGameRequestBodySchema = object({
	/**
	 * クライアントで保持しているトークン
	 * 既に参加している場合の重複参加防止に使用
	 */
	heldToken: nullable(string()),
	password: optional(gamePasswordSchema),
	playerName: playerNameSchema,
});
export type JoinGameRequestBody = InferOutput<typeof joinGameRequestBodySchema>;

/**
 * クライアントの状態に応じたレスポンス
 */
export const joinGameResponseBodySchema = variant("state", [
	object({
		/**
		 * 通常の参加成功
		 */
		state: literal("USUAL"),
		token: playerSchema.entries.gameTokenHash,
	}),
	object({
		/**
		 * 認証ユーザーに紐づくプレイヤーが既に参加済み
		 */
		state: literal("USER_PLAYER_JOINED"),
		token: playerSchema.entries.gameTokenHash,
	}),
	object({
		/**
		 * クライアントが保持しているトークンのプレイヤーが参加済み（重複ではなく意図しない退出など）
		 */
		state: literal("HELD_TOKEN_PLAYER_JOINED"),
	}),
]);
export type JoinGameResponseBody = InferOutput<
	typeof joinGameResponseBodySchema
>;

// create
export const createGameRequestBodySchema = object({
	...pick(
		createSelectSchema(roomTable, {
			timeLimit: pipe(
				number("制限時間を選択してください"),
				minValue(15, "制限時間は15秒以上で入力してください"),
				maxValue(360, "制限時間は360秒以下で入力してください"),
			),
			title: pipe(
				string(),
				minLength(1, "部屋名を入力してください"),
				maxLength(50, "部屋名は50文字以下で入力してください"),
			),
		}),
		["timeLimit", "title", "isPrivate"],
	).entries,
	...pick(
		createSelectSchema(playerTable, {
			playerName: playerNameSchema,
		}),
		["playerName"],
	).entries,
});
export type CreateGameRequestBody = InferOutput<
	typeof createGameRequestBodySchema
>;
export const createGameResponseBodySchema = object({
	gameId: roomIdSchema,
	token: playerSchema.entries.gameTokenHash,
});
export type CreateGameResponseBody = InferOutput<
	typeof createGameResponseBodySchema
>;

// verify token
export const verifyGameTokenRequestQuerySchema = object({
	token: string(),
});

// game token header (X-Game-Token)
// NOTE: HTTPヘッダーはHonoで小文字に正規化されるため、スキーマは小文字で定義
export const gameTokenHeaderSchema = object({
	"x-game-token": string(),
});
