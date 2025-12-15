import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	literal,
	pipe,
	string,
	union,
	uuid,
} from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type GameId, gameIdSchema, gameTable } from "./game";

export const roundIdSchema = pipe(string(), uuid(), brand("round_id"));
export type RoundId = InferOutput<typeof roundIdSchema>;

export const roundNoSchema = union([
	literal(1),
	literal(2),
	literal(3),
	literal(4),
]);
export type RoundNo = InferOutput<typeof roundNoSchema>;

export const roundTable = sqliteTable("round", {
	...tableBaseColumns,
	gameId: text("game_id")
		.notNull()
		.$type<GameId>()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	id: idBaseColumn.$type<RoundId>(),
	roundNo: integer("round_no").notNull().$type<RoundNo>(),
	status: text("status", { enum: ["submitting", "voting", "closed"] })
		.notNull()
		.default("submitting"),
});

export const roundSchema = createSelectSchema(roundTable, {
	gameId: gameIdSchema,
	id: roundIdSchema,
	roundNo: roundNoSchema,
});
export type Round = InferOutput<typeof roundSchema>;
