import { boolean, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";
import { gameTable } from "./game";
import { userTable } from "./user";

export const playerTable = pgTable("player", {
	...tableBaseColumns,
	gameId: uuid()
		.notNull()
		.references(() => gameTable.id, { onDelete: "cascade" }),
	isHost: boolean().notNull().default(false),
	// NOTE: ログインユーザーはuserのname
	// 匿名ユーザーは設定させる or `匿名1`のように割り振る
	playerName: text().notNull(),
	// NOTE: 席順
	seat: smallint().notNull(),
	// NOTE: 匿名ユーザーの場合はnull
	userId: uuid().references(() => userTable.id, { onDelete: "set null" }),
});

export const playerSchema = createSelectSchema(playerTable);
export type Player = InferOutput<typeof playerSchema>;
