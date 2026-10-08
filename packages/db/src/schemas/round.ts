import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	is,
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
export function isRoundNo(value: unknown): value is RoundNo {
	return is(roundNoSchema, value);
}

export const roundTable = sqliteTable(
	"round",
	{
		...tableBaseColumns,
		gameId: text("game_id")
			.notNull()
			.$type<GameId>()
			.references(() => gameTable.id, { onDelete: "cascade" }),
		id: idBaseColumn.$type<RoundId>(),
		roundNo: integer("round_no").notNull().$type<RoundNo>(),
	},
	(table) => [
		uniqueIndex("round_game_id_round_no_unique").on(
			table.gameId,
			table.roundNo,
		),
	],
);

export const roundSchema = createSelectSchema(roundTable, {
	gameId: gameIdSchema,
	id: roundIdSchema,
	roundNo: roundNoSchema,
});
export type Round = InferOutput<typeof roundSchema>;
