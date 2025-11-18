import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { gameTable } from "./game";

export const roundTable = sqliteTable("round", {
	...tableBaseColumns,
	gameId: text("game_id")
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	roundNo: integer("round_no").notNull(),
	status: text("status", { enum: ["submitting", "voting", "closed"] })
		.notNull()
		.default("submitting"),
});

export const roundSchema = createSelectSchema(roundTable);
export type Round = InferOutput<typeof roundSchema>;
