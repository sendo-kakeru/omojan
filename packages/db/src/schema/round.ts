import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type GameId, gameIdSchema, gameTable } from "./game";

export const roundIdSchema = pipe(string(), uuid(), brand("round_id"));
export type RoundId = InferOutput<typeof roundIdSchema>;

export const roundTable = sqliteTable("round", {
	...tableBaseColumns,
	gameId: text("game_id")
		.notNull()
		.$type<GameId>()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	id: idBaseColumn.$type<RoundId>(),
	roundNo: integer("round_no").notNull(),
	status: text("status", { enum: ["submitting", "voting", "closed"] })
		.notNull()
		.default("submitting"),
});

export const roundSchema = createSelectSchema(roundTable, {
	gameId: gameIdSchema,
	id: roundIdSchema,
});
export type Round = InferOutput<typeof roundSchema>;
