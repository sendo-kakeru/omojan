import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * ステータスごとのゲーム数のカウンター
 * - finished: GameService.endGame で加算し、クリーンアップの最後に再計算する
 */
export const gameCounterTable = sqliteTable("game_counter", {
	count: integer("count").notNull(),
	status: text("status", { enum: ["finished"] }).primaryKey(),
});
