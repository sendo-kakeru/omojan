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
	pick,
	pipe,
} from "valibot";

export const roomSchema = object({
	...pick(gameSchema, ["title", "isPrivate", "password", "timeLimit"]).entries,
	gameId: gameSchema.entries.id,
	players: array(
		object({
			...pick(playerSchema, ["id", "playerName", "isHost", "seat"]).entries,
			user: nullable(pick(userSchema, ["image"])),
		}),
	),
});
export type Room = InferOutput<typeof roomSchema>;

// create
export const createRoomRequestBodySchema = object({
	...pick(createSelectSchema(gameTable), ["isPrivate", "password", "title"])
		.entries,
	timeLimit: pipe(number(), minValue(1)),
	...pick(createSelectSchema(playerTable), ["playerName"]).entries,
});
export type CreateRoomRequestBody = InferOutput<
	typeof createRoomRequestBodySchema
>;
