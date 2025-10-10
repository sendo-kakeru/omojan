import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";
import { submissionTable } from "./submission";

export const voteTable = pgTable("vote", {
	...tableBaseColumns,
	playerId: uuid()
		.notNull()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	roundId: uuid()
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
	submissionId: uuid()
		.notNull()
		.references(() => submissionTable.id, { onDelete: "cascade" }),
});

// model
export const voteSchema = omit(createSelectSchema(voteTable), [
	"createdAt",
	"updatedAt",
]);
export type Vote = InferOutput<typeof voteSchema>;
