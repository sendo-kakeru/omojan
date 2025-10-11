import { pgTable, text } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";

export const wordTable = pgTable("word", {
	...tableBaseColumns,
	text: text().notNull().unique(),
});

export const wordSchema = createSelectSchema(wordTable);
export type Word = InferOutput<typeof wordSchema>;
