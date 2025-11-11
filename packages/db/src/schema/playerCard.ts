import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";
import { submissionTable } from "./submission";
import { wordTable } from "./word";

export const playerCardTable = sqliteTable("player_card", {
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
        wordId: text("word_id")
                .notNull()
                .references(() => wordTable.id, { onDelete: "cascade" }),
});

export const playerCardSchema = createSelectSchema(playerCardTable);
export type PlayerCard = InferOutput<typeof playerCardSchema>;
