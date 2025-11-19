import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type PlayerId, playerTable } from "./player";
import { type RoundId, roundTable } from "./round";
import { type SubmissionId, submissionTable } from "./submission";
import { type WordId, wordTable } from "./word";

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
		.notNull()
		.$type<SubmissionId>()
		.references(() => submissionTable.id, { onDelete: "cascade" }),
	wordId: text("word_id")
		.notNull()
		.$type<WordId>()
		.references(() => wordTable.id, { onDelete: "cascade" }),
});

export const playerCardSchema = createSelectSchema(playerCardTable);
export type PlayerCard = InferOutput<typeof playerCardSchema>;
