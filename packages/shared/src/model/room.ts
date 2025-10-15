import { gameSchema, gameTable } from "@repo/db/schema/game";
import { playerSchema, playerTable } from "@repo/db/schema/player";
import { userSchema } from "@repo/db/schema/user";
import { createSelectSchema } from "drizzle-valibot";
import {
	array,
	type InferOutput,
	maxLength,
	maxValue,
	minLength,
	minValue,
	nullable,
	number,
	object,
	omit,
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
			playerName: pipe(
				string(),
				minLength(1, "プレイヤー名を入力してください"),
				maxLength(50, "プレイヤー名は50文字以下で入力してください"),
			),
		}),
		["playerName"],
	).entries,
});
export type CreateRoomRequestBody = InferOutput<
	typeof createRoomRequestBodySchema
>;
export const createRoomResponseBodySchema = pick(roomSchema, ["gameId"]);
export type CreateRoomResponseBody = InferOutput<
	typeof createRoomResponseBodySchema
>;
