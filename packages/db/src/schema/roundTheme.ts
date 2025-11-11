import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { roundTable } from "./round";
import { wordTable } from "./word";

export const roundThemeTable = sqliteTable("round_theme", {
        ...tableBaseColumns,
        roundId: text("round_id")
                .notNull()
                .references(() => roundTable.id, { onDelete: "cascade" }),
        wordId: text("word_id")
                .notNull()
                .references(() => wordTable.id, { onDelete: "cascade" }),
});

export const roundThemeSchema = createSelectSchema(roundThemeTable);
export type RoundTheme = InferOutput<typeof roundThemeSchema>;
