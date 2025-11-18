import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";

export const roundWinnerTable = sqliteTable("round_winner", {
	...tableBaseColumns,
	playerId: text("player_id")
		.notNull()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	roundId: text("round_id")
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const roundWinnerSchema = createSelectSchema(roundWinnerTable);
export type RoundWinner = InferOutput<typeof roundWinnerSchema>;
