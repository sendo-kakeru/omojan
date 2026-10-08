import {
	type GameId,
	gameCounterTable,
	gameTable,
	type PlayerSeat,
	playerTable,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import { CleanupService } from "./CleanupService";

describe("CleanupService", () => {
	const db = createTestDbClient();
	const cleanupService = new CleanupService(db);

	const getFinishedCount = async (): Promise<number | undefined> => {
		const [counter] = await db
			.select({ count: gameCounterTable.count })
			.from(gameCounterTable)
			.where(eq(gameCounterTable.status, "finished"));
		return counter?.count;
	};

	const setFinishedCount = async (count: number): Promise<void> => {
		await db
			.update(gameCounterTable)
			.set({ count })
			.where(eq(gameCounterTable.status, "finished"));
	};

	/** 指定した人数のプレイヤーが参加した終了済みゲームを作成する */
	const insertFinishedGame = async (playerCount: number): Promise<GameId> => {
		const [game] = await db
			.insert(gameTable)
			.values({
				isPrivate: false,
				password: null,
				status: "finished",
				timeLimit: 30,
				title: "テストゲーム",
			})
			.returning({ id: gameTable.id });
		await db.insert(playerTable).values(
			Array.from({ length: playerCount }, (_, i) => ({
				gameId: game.id,
				gameTokenHash: crypto.randomUUID(),
				playerName: `Player${i + 1}`,
				seat: (i + 1) as PlayerSeat,
				userId: null,
			})),
		);
		return game.id;
	};

	beforeEach(async () => {
		await db.delete(playerTable);
		await db.delete(gameTable);
		await db.delete(gameCounterTable);
		await db.insert(gameCounterTable).values({ count: 0, status: "finished" });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("runAll", () => {
		test("プレイヤー不足で終了済みゲームが削除された後、終了済みゲーム数が再計算される", async () => {
			await insertFinishedGame(4);
			await insertFinishedGame(1);
			await setFinishedCount(2);

			const result = await cleanupService.runAll();

			expect(result.insufficientPlayerRooms).toBe(1);
			expect(await getFinishedCount()).toBe(1);
		});

		test("途中の削除処理が失敗しても終了済みゲーム数が再計算される", async () => {
			await insertFinishedGame(4);
			await insertFinishedGame(1);
			await setFinishedCount(2);
			vi.spyOn(
				cleanupService as unknown as {
					deleteStaleActiveRooms: () => Promise<number>;
				},
				"deleteStaleActiveRooms",
			).mockRejectedValue(new Error("削除に失敗しました"));

			await expect(cleanupService.runAll()).rejects.toThrow(
				"削除に失敗しました",
			);

			// 失敗前に成功した削除（プレイヤー不足の部屋）が反映されている
			expect(await getFinishedCount()).toBe(1);
		});

		test("終了済みゲーム数がずれている場合、正しい件数に上書きされ差分がログ出力される", async () => {
			await insertFinishedGame(4);
			await insertFinishedGame(4);
			await setFinishedCount(10);
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			await cleanupService.runAll();

			expect(await getFinishedCount()).toBe(2);
			expect(logSpy).toHaveBeenCalledWith(
				"終了済みゲーム数のカウンターを再計算で更新しました:",
				{ previousCount: 10, updatedCount: 2 },
			);
		});

		test("終了済みゲーム数にずれがない場合はログ出力されない", async () => {
			await insertFinishedGame(4);
			await setFinishedCount(1);
			const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

			await cleanupService.runAll();

			expect(await getFinishedCount()).toBe(1);
			expect(logSpy).not.toHaveBeenCalled();
		});

		test("カウンターの行が存在しない場合は作成される", async () => {
			await insertFinishedGame(4);
			await db.delete(gameCounterTable);

			await cleanupService.runAll();

			expect(await getFinishedCount()).toBe(1);
		});
	});
});
