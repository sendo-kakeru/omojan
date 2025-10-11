import { pgEnum, pgTable, smallint, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";
import { gameTable } from "./game";

export const roundStatusEnum = pgEnum("round_status", [
	"submitting",
	"voting",
	"closed",
]);

export const roundTable = pgTable("round", {
	...tableBaseColumns,
	gameId: uuid()
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	round_no: smallint().notNull(),
	status: roundStatusEnum().notNull().default("submitting"),
});

// model
export const roundSchema = omit(createSelectSchema(roundTable), [
	"createdAt",
	"updatedAt",
]);
export type Round = InferOutput<typeof roundSchema>;
