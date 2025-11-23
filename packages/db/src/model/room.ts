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
	gameIdSchema,
	gameSchema,
	gameTable,
	playerIdSchema,
	playerNameSchema,
	playerSchema,
	playerTable,
	userSchema,
} from "../schema";
export type { BrandSymbol };

export const roomPasswordSchema = pipe(
	string("パスワードを入力してください"),
	length(6, "パスワードは6文字で入力してください"),
);

export const roomSchema = object({
	...pick(gameSchema, ["title", "isPrivate", "password", "timeLimit"]).entries,
	gameId: gameIdSchema,
	players: array(
		object({
			...pick(playerSchema, ["playerName", "seat"]).entries,
			id: playerIdSchema,
			image: nullable(userSchema.entries.image),
		}),
	),
});
export type Room = InferOutput<typeof roomSchema>;

// find many
export const getRoomListResponseBodySchema = array(
	omit(roomSchema, ["password"]),
);
export type GetRoomListResponseBody = InferOutput<
	typeof getRoomListResponseBodySchema
>;

// find one
export const getRoomResponseBodySchema = pick(roomSchema, [
	"title",
	"isPrivate",
	"password",
	"timeLimit",
]);
export type GetRoomResponseBody = InferOutput<typeof getRoomResponseBodySchema>;

// join
export const joinRoomRequestBodySchema = object({
	/**
	 * クライアントで保持しているトークン
	 * 既に参加している場合の重複参加防止に使用
	 */
	heldToken: nullable(string()),
	password: optional(roomPasswordSchema),
	playerName: playerNameSchema,
});
export type JoinRoomRequestBody = InferOutput<typeof joinRoomRequestBodySchema>;

/**
 * クライアントの状態に応じたレスポンス
 */
export const joinRoomResponseBodySchema = variant("state", [
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
export type JoinRoomResponseBody = InferOutput<
	typeof joinRoomResponseBodySchema
>;

// create
export const createRoomRequestBodySchema = object({
	...pick(
		createSelectSchema(gameTable, {
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
export type CreateRoomRequestBody = InferOutput<
	typeof createRoomRequestBodySchema
>;
export const createRoomResponseBodySchema = object({
	gameId: gameIdSchema,
	token: playerSchema.entries.gameTokenHash,
});
export type CreateRoomResponseBody = InferOutput<
	typeof createRoomResponseBodySchema
>;

// verify token
export const verifyRoomTokenRequestQuerySchema = object({
	token: string(),
});

// game token header (X-Game-Token)
export const gameTokenHeaderSchema = object({
	"x-game-token": string(),
});
