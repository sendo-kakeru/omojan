import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";

export const wordTable = sqliteTable("word", {
        ...tableBaseColumns,
        text: text("text").notNull().unique(),
});

export const wordSchema = createSelectSchema(wordTable);
export type Word = InferOutput<typeof wordSchema>;
