import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type PlayerId, playerTable } from "./player";
import { type RoundId, roundTable } from "./round";

export const submissionIdSchema = pipe(
	string(),
	uuid(),
	brand("submission_id"),
);
export type SubmissionId = InferOutput<typeof submissionIdSchema>;

export const submissionTable = sqliteTable("submission", {
	...tableBaseColumns,
	id: idBaseColumn.$type<SubmissionId>(),
	playerId: text("player_id")
		.notNull()
		.$type<PlayerId>()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	position: text("position", { enum: ["prefix", "suffix"] }).notNull(),
	roundId: text("round_id")
		.notNull()
		.$type<RoundId>()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const submissionSchema = createSelectSchema(submissionTable);
export type Submission = InferOutput<typeof submissionSchema>;
