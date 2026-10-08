import { gameCounterTable, gameTable, playerTable } from "@repo/db/schemas";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

/** 募集中の部屋の有効期限（1時間） */
const WAITING_ROOM_TTL_MS = 60 * 60 * 1000;

/** アクティブな部屋の有効期限（1時間） */
const ACTIVE_ROOM_TTL_MS = 60 * 60 * 1000;

/** クリーンアップ対象の最大経過時間（2週間） */
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** ゲームに必要な最小プレイヤー数 */
const MIN_PLAYERS_FOR_GAME = 4;

export class CleanupService {
	constructor(private readonly db: DrizzleClient) {}

	/**
	 * 全てのクリーンアップ処理を実行する
	 */
	async runAll(): Promise<CleanupResult> {
		const results: CleanupResult = {
			insufficientPlayerRooms: 0,
			orphanedPlayers: 0,
			staleActiveRooms: 0,
			staleWaitingRooms: 0,
		};

		try {
			// 1. 募集中で1時間以上経過した部屋を削除
			results.staleWaitingRooms = await this.deleteStaleWaitingRooms();

			// 2. プレイヤーが3人以下の非募集中の部屋を削除
			results.insufficientPlayerRooms =
				await this.deleteRoomsWithInsufficientPlayers();

			// 3. アクティブで1時間以上経過した部屋を削除
			results.staleActiveRooms = await this.deleteStaleActiveRooms();

			// 4. 孤立したプレイヤーを削除
			results.orphanedPlayers = await this.deleteOrphanedPlayers();
		} finally {
			// 5. 終了済みゲーム数のカウンターを再計算
			// 削除による件数の減少を反映するため、途中の削除処理が失敗しても最後に必ず実行する
			await this.recalculateFinishedGameCount();
		}

		return results;
	}

	/**
	 * 終了済みゲーム数を数え直してカウンターを上書きする
	 * - 集計と更新を単一の文で行い、間にゲームが終了しても件数がずれないようにする
	 */
	private async recalculateFinishedGameCount(): Promise<void> {
		const finishedCountSql = sql<number>`(SELECT count(*) FROM ${gameTable} WHERE ${gameTable.status} = 'finished')`;

		const [previousResults, updatedResults] = await this.db.batch([
			this.db
				.select({ count: gameCounterTable.count })
				.from(gameCounterTable)
				.where(eq(gameCounterTable.status, "finished")),
			this.db
				.insert(gameCounterTable)
				.values({ count: finishedCountSql, status: "finished" })
				.onConflictDoUpdate({
					set: { count: finishedCountSql },
					target: gameCounterTable.status,
				})
				.returning({ count: gameCounterTable.count }),
		]);
		const previousCount = previousResults[0]?.count;
		const updatedCount = updatedResults[0]?.count;

		if (previousCount !== updatedCount) {
			console.log("終了済みゲーム数のカウンターを再計算で更新しました:", {
				previousCount: previousCount ?? null,
				updatedCount,
			});
		}
	}

	/**
	 * 募集中で最終更新から1時間以上経過した部屋を削除
	 * ただし、作成から2週間以上経過したものは対象外
	 */
	private async deleteStaleWaitingRooms(): Promise<number> {
		const threshold = new Date(Date.now() - WAITING_ROOM_TTL_MS);
		const maxAgeThreshold = new Date(Date.now() - MAX_AGE_MS);

		const result = await this.db
			.delete(gameTable)
			.where(
				and(
					eq(gameTable.status, "waiting"),
					lt(gameTable.updatedAt, threshold),
					gte(gameTable.createdAt, maxAgeThreshold),
				),
			)
			.returning({ id: gameTable.id });

		return result.length;
	}

	/**
	 * アクティブで最終更新から1時間以上経過した部屋を削除
	 * ただし、作成から2週間以上経過したものは対象外
	 */
	private async deleteStaleActiveRooms(): Promise<number> {
		const threshold = new Date(Date.now() - ACTIVE_ROOM_TTL_MS);
		const maxAgeThreshold = new Date(Date.now() - MAX_AGE_MS);

		const result = await this.db
			.delete(gameTable)
			.where(
				and(
					eq(gameTable.status, "active"),
					lt(gameTable.updatedAt, threshold),
					gte(gameTable.createdAt, maxAgeThreshold),
				),
			)
			.returning({ id: gameTable.id });

		return result.length;
	}

	/**
	 * プレイヤーが3人以下の非募集中の部屋を削除
	 * ただし、作成から2週間以上経過したものは対象外
	 */
	private async deleteRoomsWithInsufficientPlayers(): Promise<number> {
		const maxAgeThreshold = new Date(Date.now() - MAX_AGE_MS);

		// プレイヤー数が4人未満の非募集中ゲームを取得
		const gamesWithInsufficientPlayers = await this.db
			.select({
				gameId: playerTable.gameId,
			})
			.from(playerTable)
			.innerJoin(gameTable, eq(playerTable.gameId, gameTable.id))
			.where(
				and(
					// 募集中以外（active または finished）
					sql`${gameTable.status} != 'waiting'`,
					// 作成から2週間以内
					gte(gameTable.createdAt, maxAgeThreshold),
				),
			)
			.groupBy(playerTable.gameId)
			.having(sql`count(*) < ${MIN_PLAYERS_FOR_GAME}`);

		if (gamesWithInsufficientPlayers.length === 0) {
			return 0;
		}

		const gameIds = gamesWithInsufficientPlayers.map((g) => g.gameId);

		const result = await this.db
			.delete(gameTable)
			.where(sql`${gameTable.id} IN (${sql.join(gameIds, sql`, `)})`)
			.returning({ id: gameTable.id });

		return result.length;
	}

	/**
	 * 孤立したプレイヤー（ゲームが存在しない）を削除
	 * ただし、作成から2週間以上経過したものは対象外
	 */
	private async deleteOrphanedPlayers(): Promise<number> {
		const maxAgeThreshold = new Date(Date.now() - MAX_AGE_MS);

		// NOT EXISTS サブクエリで孤立プレイヤーを直接削除
		const result = await this.db
			.delete(playerTable)
			.where(
				and(
					sql`NOT EXISTS (SELECT 1 FROM ${gameTable} WHERE ${gameTable.id} = ${playerTable.gameId})`,
					gte(playerTable.createdAt, maxAgeThreshold),
				),
			)
			.returning({ id: playerTable.id });

		return result.length;
	}
}

export type CleanupResult = {
	staleWaitingRooms: number;
	staleActiveRooms: number;
	insufficientPlayerRooms: number;
	orphanedPlayers: number;
};
