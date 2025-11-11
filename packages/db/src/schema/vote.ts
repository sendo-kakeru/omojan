import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";
import { submissionTable } from "./submission";

export const voteTable = sqliteTable("vote", {
        ...tableBaseColumns,
        playerId: text("player_id")
                .notNull()
                .references(() => playerTable.id, { onDelete: "cascade" }),
        roundId: text("round_id")
                .notNull()
                .references(() => roundTable.id, { onDelete: "cascade" }),
        submissionId: text("submission_id")
                .notNull()
                .references(() => submissionTable.id, { onDelete: "cascade" }),
});

export const voteSchema = createSelectSchema(voteTable);
export type Vote = InferOutput<typeof voteSchema>;
