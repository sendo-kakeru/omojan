import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	type InferOutput,
	is,
	literal,
	maxLength,
	minLength,
	pipe,
	string,
	union,
} from "valibot";
import { tableBaseColumns } from "./common";
import { gameTable } from "./game";
import { userTable } from "./user";

export const playerTable = sqliteTable("player", {
	...tableBaseColumns,
	gameId: text("game_id")
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	gameTokenHash: text("game_token_hash").notNull().unique(),
	isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
	playerName: text("player_name").notNull(),
	seat: integer("seat").notNull().$type<1 | 2 | 3 | 4>(),
	userId: text("user_id").references(() => userTable.id, {
		onDelete: "set null",
	}),
});

export const playerNameSchema = pipe(
	string(),
	minLength(1, "プレイヤー名を入力してください"),
	maxLength(50, "プレイヤー名は50文字以下で入力してください"),
);

export const playerSeatSchema = union([
	literal(1),
	literal(2),
	literal(3),
	literal(4),
]);

export const playerSchema = createSelectSchema(playerTable, {
	playerName: playerNameSchema,
	seat: playerSeatSchema,
});
export type PlayerSeat = InferOutput<typeof playerSeatSchema>;
export function isPlayerSeat(seat: number): seat is PlayerSeat {
	return is(playerSeatSchema, seat);
}

export type Player = InferOutput<typeof playerSchema>;
