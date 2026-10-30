import {
	type GameId,
	gameTable,
	type PlayerSeat,
	playerTable,
	type UserId,
	userTable,
} from "@repo/db/schemas";
import { MOCK_USER } from "@repo/mock/model";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import { UserService } from "./UserService";

describe("UserService", () => {
	const db = createTestDbClient();
	const userService = new UserService(db);

	/**
	 * ゲームを作成し、指定したユーザーをプレイヤーとして参加させる
	 */
	const insertGameWithPlayer = async ({
		isWinner,
		status,
		userId,
	}: {
		isWinner: boolean;
		status: "waiting" | "active" | "finished";
		userId: UserId;
	}): Promise<GameId> => {
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
		await db.insert(playerTable).values({
			gameId: game.id,
			gameTokenHash: crypto.randomUUID(),
			isWinner,
			playerName: "プレイヤー",
			seat: 1 as PlayerSeat,
			userId,
		});
		return game.id;
	};

	beforeEach(async () => {
		await db.delete(playerTable);
		await db.delete(gameTable);
		await db.delete(userTable);
	});

	describe("findById", () => {
		test("終了済みゲームの参加数と勝者になった数を返す", async () => {
			const [user] = await db
				.insert(userTable)
				.values(MOCK_USER)
				.returning({ id: userTable.id });
			await insertGameWithPlayer({
				isWinner: true,
				status: "finished",
				userId: user.id,
			});
			await insertGameWithPlayer({
				isWinner: true,
				status: "finished",
				userId: user.id,
			});
			await insertGameWithPlayer({
				isWinner: false,
				status: "finished",
				userId: user.id,
			});

			const result = await userService.findById({ id: user.id });

			expect(result?.playCount).toBe(3);
			expect(result?.winCount).toBe(2);
		});

		test("終了していないゲームは数えない", async () => {
			const [user] = await db
				.insert(userTable)
				.values(MOCK_USER)
				.returning({ id: userTable.id });
			await insertGameWithPlayer({
				isWinner: false,
				status: "waiting",
				userId: user.id,
			});
			await insertGameWithPlayer({
				isWinner: false,
				status: "active",
				userId: user.id,
			});

			const result = await userService.findById({ id: user.id });

			expect(result?.playCount).toBe(0);
			expect(result?.winCount).toBe(0);
		});
	});
});
