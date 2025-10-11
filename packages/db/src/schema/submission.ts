import { pgEnum, pgTable, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { playerTable } from "./player";
import { roundTable } from "./round";

export const submissionPositionEnum = pgEnum("submission_position", [
	"prefix",
	"suffix",
]);

export const submissionTable = pgTable("submission", {
	...tableBaseColumns,
	playerId: uuid()
		.notNull()
		.references(() => playerTable.id, { onDelete: "cascade" }),
	position: submissionPositionEnum().notNull(),
	roundId: uuid()
		.notNull()
		.references(() => roundTable.id, { onDelete: "cascade" }),
});

export const submissionSchema = createSelectSchema(submissionTable);
export type Submission = InferOutput<typeof submissionSchema>;
