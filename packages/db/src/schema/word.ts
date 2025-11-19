import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";

export const wordIdSchema = pipe(string(), uuid(), brand("word_id"));
export type WordId = InferOutput<typeof wordIdSchema>;

export const wordTable = sqliteTable("word", {
	...tableBaseColumns,
	id: idBaseColumn.$type<WordId>(),
	text: text("text").notNull().unique(),
});

export const wordSchema = createSelectSchema(wordTable);
export type Word = InferOutput<typeof wordSchema>;
