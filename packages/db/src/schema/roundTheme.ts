import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";
import { roundTable } from "./round";
import { wordTable } from "./word";

export const roundThemeTable = pgTable("round_theme", {
	...tableBaseColumns,
	roundId: uuid()
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
	wordId: uuid()
		.notNull()
		.references(() => wordTable.id, { onDelete: "cascade" }),
});

// model
export const roundThemeSchema = omit(createSelectSchema(roundThemeTable), [
	"createdAt",
	"updatedAt",
]);
export type RoundTheme = InferOutput<typeof roundThemeSchema>;
