import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type PlayerId, playerIdSchema, playerTable } from "./player";
import { type RoundId, roundIdSchema, roundTable } from "./round";

export const roundWinnerIdSchema = pipe(
	string(),
	uuid(),
	brand("round_winner_id"),
);
export type RoundWinnerId = InferOutput<typeof roundWinnerIdSchema>;

export const roundWinnerTable = sqliteTable("round_winner", {
	...tableBaseColumns,
	id: idBaseColumn.$type<RoundWinnerId>(),
	playerId: text("player_id")
		.notNull()
		.$type<PlayerId>()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	roundId: text("round_id")
		.notNull()
		.$type<RoundId>()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const roundWinnerSchema = createSelectSchema(roundWinnerTable, {
	id: roundWinnerIdSchema,
	playerId: playerIdSchema,
	roundId: roundIdSchema,
});
export type RoundWinner = InferOutput<typeof roundWinnerSchema>;
