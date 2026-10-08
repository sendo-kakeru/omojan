import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, nullable, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type GameId, gameIdSchema, gameTable } from "./game";
import { type PlayerId, playerIdSchema, playerTable } from "./player";
import { type RoundId, roundIdSchema, roundTable } from "./round";
import {
	type SubmissionId,
	submissionIdSchema,
	submissionTable,
} from "./submission";

export const playerCardIdSchema = pipe(
	string(),
	uuid(),
	brand("player_card_id"),
);
export type PlayerCardId = InferOutput<typeof playerCardIdSchema>;

export const playerCardTable = sqliteTable(
	"player_card",
	{
		...tableBaseColumns,
		gameId: text("game_id")
			.notNull()
			.$type<GameId>()
			.references(() => gameTable.id, { onDelete: "cascade" }),
		id: idBaseColumn.$type<PlayerCardId>(),
		playerId: text("player_id")
			.notNull()
			.$type<PlayerId>()
			.references(() => playerTable.id, { onDelete: "cascade" }),
		roundId: text("round_id")
			.$type<RoundId>()
			.references(() => roundTable.id, { onDelete: "cascade" }),
		submissionId: text("submission_id")
			.$type<SubmissionId>()
			.references(() => submissionTable.id, { onDelete: "set null" }),
		text: text("text").notNull(),
	},
	(table) => [
		index("player_card_game_id_idx").on(table.gameId),
		index("player_card_player_id_idx").on(table.playerId),
	],
);

export const playerCardSchema = createSelectSchema(playerCardTable, {
	gameId: gameIdSchema,
	id: playerCardIdSchema,
	playerId: playerIdSchema,
	roundId: nullable(roundIdSchema),
	submissionId: nullable(submissionIdSchema),
});
export type PlayerCard = InferOutput<typeof playerCardSchema>;
