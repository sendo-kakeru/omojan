import { boolean, pgEnum, pgTable, smallint, text } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";

export const gameStatusEnum = pgEnum("game_status", [
	"waiting",
	"active",
	"finished",
]);

export const gameTable = pgTable("game", {
	...tableBaseColumns,
	isPrivate: boolean().notNull().default(false),
	passWord: text(),
	status: gameStatusEnum().notNull().default("waiting"),
	timeLimit: smallint().notNull(),
	title: text().notNull(),
});

// model
export const gameSchema = omit(createSelectSchema(gameTable), [
	"createdAt",
	"updatedAt",
]);
export type Game = InferOutput<typeof gameSchema>;
