import {
	type GameId,
	gameCounterTable,
	gameTable,
	playerTable,
} from "@repo/db/schemas";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import { GameService } from "./GameService";

describe("GameService", () => {
	const db = createTestDbClient();
	const gameService = new GameService(db);

	const getFinishedCount = async (): Promise<number | undefined> => {
		const [counter] = await db
			.select({ count: gameCounterTable.count })
			.from(gameCounterTable)
			.where(eq(gameCounterTable.status, "finished"));
		return counter?.count;
	};

	const insertGame = async (
		status: "waiting" | "active" | "finished",
	): Promise<GameId> => {
		const [game] = await db
			.insert(gameTable)
			.values({
				isPrivate: false,
				password: null,
				status,
				timeLimit: 30,
				title: "テストゲーム",
			})
			.returning({ id: gameTable.id });
		return game.id;
	};

	beforeEach(async () => {
		await db.delete(playerTable);
		await db.delete(gameTable);
		await db.delete(gameCounterTable);
		await db.insert(gameCounterTable).values({ count: 5, status: "finished" });
	});

	describe("endGame", () => {
		test.each(["waiting", "active"] as const)(
			"%sのゲームを終了すると終了済みゲーム数が1加算される",
			async (status) => {
				const gameId = await insertGame(status);

				await gameService.endGame({ gameId });

				const [game] = await db
					.select({ status: gameTable.status })
					.from(gameTable)
					.where(eq(gameTable.id, gameId));
				expect(game?.status).toBe("finished");
				expect(await getFinishedCount()).toBe(6);
			},
		);

		test("既に終了済みのゲームに対して呼んでも終了済みゲーム数は変わらない", async () => {
			const gameId = await insertGame("finished");

			await gameService.endGame({ gameId });

			expect(await getFinishedCount()).toBe(5);
		});

		test("同じゲームに対して複数回呼んでも1回分しか加算されない", async () => {
			const gameId = await insertGame("active");

			await gameService.endGame({ gameId });
			await gameService.endGame({ gameId });

			expect(await getFinishedCount()).toBe(6);
		});
	});
});
