import { pgTable, text } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";

export const wordTable = pgTable("word", {
	...tableBaseColumns,
	text: text().notNull().unique(),
});

// model
export const wordSchema = omit(createSelectSchema(wordTable), [
	"createdAt",
	"updatedAt",
]);
export type Word = InferOutput<typeof wordSchema>;
