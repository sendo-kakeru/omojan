import { gameSchema, gameTable } from "@repo/db/schema/game";
import { playerSchema, playerTable } from "@repo/db/schema/player";
import { userSchema } from "@repo/db/schema/user";
import { createSelectSchema } from "drizzle-valibot";
import {
	array,
	type InferOutput,
	minValue,
	nullable,
	number,
	object,
	omit,
	pick,
	pipe,
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
	...pick(createSelectSchema(gameTable), ["isPrivate", "title"]).entries,
	timeLimit: pipe(number(), minValue(1)),
	...pick(createSelectSchema(playerTable), ["playerName"]).entries,
});
export type CreateRoomRequestBody = InferOutput<
	typeof createRoomRequestBodySchema
>;
export const createRoomResponseBodySchema = pick(roomSchema, ["gameId"]);
export type CreateRoomResponseBody = InferOutput<
	typeof createRoomResponseBodySchema
>;
