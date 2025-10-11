import { pgTable, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";
import { submissionTable } from "./submission";
import { wordTable } from "./word";

export const playerCardTable = pgTable("player_card", {
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
	wordId: uuid()
		.notNull()
		.references(() => wordTable.id, { onDelete: "cascade" }),
});

// model
export const playerCardSchema = omit(createSelectSchema(playerCardTable), [
	"createdAt",
	"updatedAt",
]);
export type PlayerCard = InferOutput<typeof playerCardSchema>;
