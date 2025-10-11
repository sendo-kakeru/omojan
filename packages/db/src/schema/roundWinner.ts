import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";

export const roundWinnerTable = pgTable("round_winner", {
	...tableBaseColumns,
	playerId: uuid()
		.notNull()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	roundId: uuid()
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const roundWinnerSchema = createSelectSchema(roundWinnerTable);
export type RoundWinner = InferOutput<typeof roundWinnerSchema>;
