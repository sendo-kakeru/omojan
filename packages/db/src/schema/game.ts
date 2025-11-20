import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	object,
	pipe,
	safeParse,
	string,
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

export const gameIdRequestParamSchema = object({ gameId: gameIdSchema });
