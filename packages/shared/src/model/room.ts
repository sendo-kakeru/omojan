import { gameSchema, gameTable } from "@repo/db/schema/game";
import {
	playerNameSchema,
	playerSchema,
	playerTable,
} from "@repo/db/schema/player";
import { userSchema } from "@repo/db/schema/user";
import { createSelectSchema } from "drizzle-valibot";
import {
	array,
	type InferOutput,
	length,
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
} from "valibot";

export const roomSchema = object({
	...pick(gameSchema, ["title", "isPrivate", "password", "timeLimit"]).entries,
	gameId: gameSchema.entries.id,
	players: array(
		object({
			...pick(playerSchema, ["id", "playerName", "isHost", "seat"]).entries,
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

// join
export const joinRoomRequestBodySchema = object({
	/**
	 * クライアントで保持しているトークン
	 * 既に参加している場合の重複参加防止に使用
	 */
	heldToken: nullable(string()),
	password: optional(
		pipe(string(), length(6, "パスワードは6文字で入力してください")),
	),
	playerName: playerNameSchema,
});
export type JoinRoomRequestBody = InferOutput<typeof joinRoomRequestBodySchema>;

export const joinRoomResponseBodySchema = object({
	token: playerSchema.entries.gameTokenHash,
});
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
	...joinRoomResponseBodySchema.entries,
	gameId: gameSchema.entries.id,
});
export type CreateRoomResponseBody = InferOutput<
	typeof createRoomResponseBodySchema
>;

// verify token
export const verifyRoomTokenRequestQuerySchema = object({
	token: string(),
});
