import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	is,
	literal,
	maxLength,
	minLength,
	nullable,
	pipe,
	string,
	trim,
	union,
	uuid,
} from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type GameId, gameIdSchema, gameTable } from "./game";
import { type UserId, userIdSchema, userTable } from "./user";

export const playerIdSchema = pipe(string(), uuid(), brand("player_id"));
export type PlayerId = InferOutput<typeof playerIdSchema>;
export function isPlayerId(id: unknown): id is PlayerId {
	return is(playerIdSchema, id);
}

export const playerSeatSchema = union([
	literal(1),
	literal(2),
	literal(3),
	literal(4),
]);
export type PlayerSeat = InferOutput<typeof playerSeatSchema>;

export const playerTable = sqliteTable(
	"player",
	{
		...tableBaseColumns,
		gameId: text("game_id")
			.notNull()
			.$type<GameId>()
			.references(() => gameTable.id, { onDelete: "cascade" }),
		gameTokenHash: text("game_token_hash").notNull().unique(),
		id: idBaseColumn.$type<PlayerId>(),
		isCpu: integer("is_cpu", { mode: "boolean" }).notNull().default(false),
		/**
		 * ホストの機能は現状、募集人数が足りなくてもゲーム開始を実行できるのみ
		 * ホストが部屋を退出してもホストがいない部屋として続行する
		 */
		isHost: integer("is_host", { mode: "boolean" }).notNull().default(false),
		// NOTE: ログインユーザーはuserのname
		// 匿名ユーザーは設定させる or `匿名1`のように割り振る
		playerName: text("player_name").notNull(),
		// NOTE: 席順 1~4
		seat: integer("seat").notNull().$type<PlayerSeat>(),
		// NOTE: 匿名ユーザーの場合はnull
		userId: text("user_id")
			.$type<UserId | null>()
			.references(() => userTable.id, {
				onDelete: "set null",
			}),
	},
	(table) => [
		index("player_game_id_idx").on(table.gameId),
		index("player_user_id_idx").on(table.userId),
	],
);

export const playerNameSchema = pipe(
	string(),
	trim(),
	minLength(1, "プレイヤー名を入力してください"),
	maxLength(50, "プレイヤー名は50文字以下で入力してください"),
);

export const playerSchema = createSelectSchema(playerTable, {
	gameId: gameIdSchema,
	id: playerIdSchema,
	playerName: playerNameSchema,
	seat: playerSeatSchema,
	userId: nullable(userIdSchema),
});
export function isPlayerSeat(seat: number): seat is PlayerSeat {
	return is(playerSeatSchema, seat);
}

export type Player = InferOutput<typeof playerSchema>;

/** ユーザー名を優先し、匿名/削除ユーザーは playerName にフォールバック */
export const playerNameExpression =
	sql<string>`COALESCE(${userTable.name}, ${playerTable.playerName})`.as(
		"playerName",
	);
