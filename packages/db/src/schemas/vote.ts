import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
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

export const voteIdSchema = pipe(string(), uuid(), brand("vote_id"));
export type VoteId = InferOutput<typeof voteIdSchema>;

export const voteTable = sqliteTable(
	"vote",
	{
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
	},
	(table) => [
		uniqueIndex("vote_player_id_round_id_unique").on(
			table.playerId,
			table.roundId,
		),
	],
);

export const voteSchema = createSelectSchema(voteTable, {
	id: voteIdSchema,
	playerId: playerIdSchema,
	roundId: roundIdSchema,
	submissionId: submissionIdSchema,
});
export type Vote = InferOutput<typeof voteSchema>;
