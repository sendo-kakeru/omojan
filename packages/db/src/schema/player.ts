import { boolean, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
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

export const playerTable = pgTable("player", {
	...tableBaseColumns,
	gameId: uuid()
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	gameTokenHash: text().notNull().unique(),
	isHost: boolean().notNull().default(false),
	// NOTE: ログインユーザーはuserのname
	// 匿名ユーザーは設定させる or `匿名1`のように割り振る
	playerName: text().notNull(),
	// NOTE: 席順 1~4
	seat: smallint().notNull().$type<1 | 2 | 3 | 4>(),
	// NOTE: 匿名ユーザーの場合はnull
	userId: uuid().references(() => userTable.id, { onDelete: "set null" }),
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
