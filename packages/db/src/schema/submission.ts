import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";

export const submissionTable = sqliteTable("submission", {
	...tableBaseColumns,
	playerId: text("player_id")
		.notNull()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	position: text("position", { enum: ["prefix", "suffix"] }).notNull(),
	roundId: text("round_id")
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const submissionSchema = createSelectSchema(submissionTable);
export type Submission = InferOutput<typeof submissionSchema>;
