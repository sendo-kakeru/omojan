import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type PlayerId, playerIdSchema, playerTable } from "./player";
import { type RoundId, roundIdSchema, roundTable } from "./round";
import {
	type SubmissionId,
	submissionIdSchema,
	submissionTable,
} from "./submission";

export const playerCardIdSchema = pipe(
	string(),
	uuid(),
	brand("player_card_id"),
);
export type PlayerCardId = InferOutput<typeof playerCardIdSchema>;

export const playerCardTable = sqliteTable("player_card", {
	...tableBaseColumns,
	id: idBaseColumn.$type<PlayerCardId>(),
	playerId: text("player_id")
		.notNull()
		.$type<PlayerId>()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	roundId: text("round_id")
		.notNull()
		.$type<RoundId>()
		.references(() => roundTable.id, { onDelete: "cascade" }),
	submissionId: text("submission_id")
		.$type<SubmissionId>()
		.references(() => submissionTable.id, { onDelete: "set null" }),
	text: text("text").notNull(),
});

export const playerCardSchema = createSelectSchema(playerCardTable, {
	id: playerCardIdSchema,
	playerId: playerIdSchema,
	roundId: roundIdSchema,
	submissionId: submissionIdSchema,
});
export type PlayerCard = InferOutput<typeof playerCardSchema>;
