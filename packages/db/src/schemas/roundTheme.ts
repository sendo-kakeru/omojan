import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type RoundId, roundIdSchema, roundTable } from "./round";

export const roundThemeIdSchema = pipe(
	string(),
	uuid(),
	brand("round_theme_id"),
);
export type RoundThemeId = InferOutput<typeof roundThemeIdSchema>;

export const roundThemeTable = sqliteTable("round_theme", {
	...tableBaseColumns,
	id: idBaseColumn.$type<RoundThemeId>(),
	roundId: text("round_id")
		.notNull()
		.$type<RoundId>()
		.references(() => roundTable.id, { onDelete: "cascade" }),
	text: text("text").notNull(),
});

export const roundThemeSchema = createSelectSchema(roundThemeTable, {
	id: roundThemeIdSchema,
	roundId: roundIdSchema,
});
export type RoundTheme = InferOutput<typeof roundThemeSchema>;
