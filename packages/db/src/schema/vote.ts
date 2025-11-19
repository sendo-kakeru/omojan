import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type PlayerId, playerTable } from "./player";
import { type RoundId, roundTable } from "./round";
import { type SubmissionId, submissionTable } from "./submission";

export const voteIdSchema = pipe(string(), uuid(), brand("vote_id"));
export type VoteId = InferOutput<typeof voteIdSchema>;

export const voteTable = sqliteTable("vote", {
	...tableBaseColumns,
	id: idBaseColumn.$type<VoteId>(),
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
});

export const voteSchema = createSelectSchema(voteTable);
export type Vote = InferOutput<typeof voteSchema>;
