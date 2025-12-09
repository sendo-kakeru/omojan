import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	literal,
	object,
	pipe,
	safeParse,
	string,
	union,
	uuid,
} from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";

export const gameIdSchema = pipe(string(), uuid(), brand("game_id"));
export type GameId = InferOutput<typeof gameIdSchema>;

export function isGameId(id: unknown): id is GameId {
	const result = safeParse(gameIdSchema, id);
	return result.success;
}

export const gameTable = sqliteTable("game", {
	...tableBaseColumns,
	id: idBaseColumn.$type<GameId>(),
	isPrivate: integer("is_private", { mode: "boolean" })
		.notNull()
		.default(false),
	password: text("password"),
	status: text("status", { enum: ["waiting", "active", "finished"] })
		.notNull()
		.default("waiting"),
	timeLimit: integer("time_limit").notNull(),
	title: text("title").notNull(),
});

export const gameSchema = createSelectSchema(gameTable, {
	id: gameIdSchema,
});
export type Game = InferOutput<typeof gameSchema>;

export const gameStateSchema = union([
	literal("waiting"),
	literal("setting"), // 不要だったら消す
	literal("submission"),
	literal("voting"),
	literal("result"),
]);
export type GameState = InferOutput<typeof gameStateSchema>;

export const gameIdRequestParamSchema = object({ gameId: gameIdSchema });
