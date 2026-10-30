import {
	type GameId,
	gameCounterTable,
	gameTable,
	type PlayerId,
	type PlayerSeat,
	playerCardTable,
	playerTable,
	type RoundId,
	type RoundNo,
	roundTable,
	submissionTable,
	voteTable,
} from "@repo/db/schemas";
import { asc, eq } from "drizzle-orm";
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

	/**
	 * プレイヤーを作成する（席順で返す）
	 */
	const insertPlayers = async ({
		gameId,
		playerCount,
	}: {
		gameId: GameId;
		playerCount: number;
	}): Promise<PlayerId[]> => {
		const players = await db
			.insert(playerTable)
			.values(
				Array.from({ length: playerCount }, (_, i) => ({
					gameId,
					gameTokenHash: crypto.randomUUID(),
					playerName: `プレイヤー${i + 1}`,
					seat: (i + 1) as PlayerSeat,
				})),
			)
			.returning({ id: playerTable.id, seat: playerTable.seat });
		return players.sort((a, b) => a.seat - b.seat).map((player) => player.id);
	};

	/**
	 * ラウンドを作成し、全プレイヤーの提出と投票を作成する
	 * votedPlayerIndexes: 各プレイヤーが投票した提出のプレイヤーのインデックス
	 */
	const insertRound = async ({
		gameId,
		playerIds,
		roundNo,
		votedPlayerIndexes,
	}: {
		gameId: GameId;
		playerIds: PlayerId[];
		roundNo: RoundNo;
		votedPlayerIndexes: number[];
	}): Promise<void> => {
		const [round] = await db
			.insert(roundTable)
			.values({ gameId, roundNo })
			.returning({ id: roundTable.id });
		const submissions = await db
			.insert(submissionTable)
			.values(
				playerIds.map((playerId) => ({
					playerId,
					position: "prefix" as const,
					roundId: round.id,
				})),
			)
			.returning({
				id: submissionTable.id,
				playerId: submissionTable.playerId,
			});
		if (votedPlayerIndexes.length === 0) return;

		await db.insert(voteTable).values(
			votedPlayerIndexes.map((votedPlayerIndex, voterIndex) => {
				const submission = submissions.find(
					(submission) => submission.playerId === playerIds[votedPlayerIndex],
				);
				if (!submission) throw new Error("提出が見つかりません");
				return {
					playerId: playerIds[voterIndex],
					roundId: round.id,
					submissionId: submission.id,
				};
			}),
		);
	};

	const getWinnerFlags = async (gameId: GameId): Promise<boolean[]> => {
		const players = await db
			.select({ isWinner: playerTable.isWinner })
			.from(playerTable)
			.where(eq(playerTable.gameId, gameId))
			.orderBy(asc(playerTable.seat));
		return players.map((player) => player.isWinner);
	};

	beforeEach(async () => {
		await db.delete(voteTable);
		await db.delete(playerCardTable);
		await db.delete(submissionTable);
		await db.delete(roundTable);
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

		test("ラウンド勝利数が最も多いプレイヤーが勝者として保存される", async () => {
			const gameId = await insertGame("active");
			const playerIds = await insertPlayers({ gameId, playerCount: 4 });
			// ラウンド1,2はプレイヤー1、ラウンド3はプレイヤー2が最多得票
			await insertRound({
				gameId,
				playerIds,
				roundNo: 1,
				votedPlayerIndexes: [1, 0, 0, 0],
			});
			await insertRound({
				gameId,
				playerIds,
				roundNo: 2,
				votedPlayerIndexes: [1, 0, 0, 2],
			});
			await insertRound({
				gameId,
				playerIds,
				roundNo: 3,
				votedPlayerIndexes: [1, 0, 1, 1],
			});

			await gameService.endGame({ gameId });

			expect(await getWinnerFlags(gameId)).toEqual([true, false, false, false]);
		});

		test("ラウンド勝利数が同率1位のプレイヤーは全員が勝者として保存される", async () => {
			const gameId = await insertGame("active");
			const playerIds = await insertPlayers({ gameId, playerCount: 4 });
			// ラウンド1はプレイヤー1、ラウンド2はプレイヤー1と3が同率、ラウンド3はプレイヤー3
			await insertRound({
				gameId,
				playerIds,
				roundNo: 1,
				votedPlayerIndexes: [1, 0, 0, 0],
			});
			await insertRound({
				gameId,
				playerIds,
				roundNo: 2,
				votedPlayerIndexes: [2, 0, 0, 2],
			});
			await insertRound({
				gameId,
				playerIds,
				roundNo: 3,
				votedPlayerIndexes: [2, 2, 3, 2],
			});

			await gameService.endGame({ gameId });

			expect(await getWinnerFlags(gameId)).toEqual([true, false, true, false]);
		});

		test("全ラウンドで投票がない場合は勝者なしとなる", async () => {
			const gameId = await insertGame("active");
			const playerIds = await insertPlayers({ gameId, playerCount: 4 });
			await insertRound({
				gameId,
				playerIds,
				roundNo: 1,
				votedPlayerIndexes: [],
			});

			await gameService.endGame({ gameId });

			expect(await getWinnerFlags(gameId)).toEqual([
				false,
				false,
				false,
				false,
			]);
		});

		test("既に終了済みのゲームに対して呼んでも勝者は更新されない", async () => {
			const gameId = await insertGame("finished");
			const playerIds = await insertPlayers({ gameId, playerCount: 4 });
			await insertRound({
				gameId,
				playerIds,
				roundNo: 1,
				votedPlayerIndexes: [1, 0, 0, 0],
			});

			await gameService.endGame({ gameId });

			expect(await getWinnerFlags(gameId)).toEqual([
				false,
				false,
				false,
				false,
			]);
		});

		test("他のゲームのプレイヤーの勝者は変わらない", async () => {
			const gameId = await insertGame("active");
			const otherGameId = await insertGame("active");
			const playerIds = await insertPlayers({ gameId, playerCount: 4 });
			await insertPlayers({ gameId: otherGameId, playerCount: 4 });
			await insertRound({
				gameId,
				playerIds,
				roundNo: 1,
				votedPlayerIndexes: [1, 0, 0, 0],
			});

			await gameService.endGame({ gameId });

			expect(await getWinnerFlags(otherGameId)).toEqual([
				false,
				false,
				false,
				false,
			]);
		});
	});

	describe("calculateWinnersAndWinCountsFromRoundWinners", () => {
		const [playerA, playerB, playerC] = [
			crypto.randomUUID(),
			crypto.randomUUID(),
			crypto.randomUUID(),
		] as PlayerId[];

		test("ラウンド勝利数が最も多いプレイヤーのみが勝者になる", () => {
			const result = GameService.calculateWinnersAndWinCountsFromRoundWinners({
				winnerPlayerIdsPerRound: [[playerA], [playerB], [playerA], []],
			});

			expect(result.winnerPlayerIds).toEqual([playerA]);
			expect(result.winCountByPlayer.get(playerA)).toBe(2);
			expect(result.winCountByPlayer.get(playerB)).toBe(1);
		});

		test("同率1位が複数いる場合は全員が勝者になる", () => {
			const result = GameService.calculateWinnersAndWinCountsFromRoundWinners({
				winnerPlayerIdsPerRound: [
					[playerA, playerB],
					[playerC],
					[playerB],
					[playerA],
				],
			});

			expect(result.winnerPlayerIds).toEqual([playerA, playerB]);
		});

		test("全ラウンドで勝者がいない場合は勝者なしになる", () => {
			const result = GameService.calculateWinnersAndWinCountsFromRoundWinners({
				winnerPlayerIdsPerRound: [[], [], [], []],
			});

			expect(result.winnerPlayerIds).toEqual([]);
			expect(result.winCountByPlayer.size).toBe(0);
		});
	});

	describe("saveSubmission", () => {
		const setupRound = async (): Promise<{
			gameId: GameId;
			playerId: PlayerId;
			roundId: RoundId;
		}> => {
			const gameId = await insertGame("active");
			const [playerId] = await insertPlayers({ gameId, playerCount: 1 });
			const [round] = await db
				.insert(roundTable)
				.values({ gameId, roundNo: 1 })
				.returning({ id: roundTable.id });
			await db.insert(playerCardTable).values([
				{ gameId, playerId, text: "カードA" },
				{ gameId, playerId, text: "カードB" },
			]);
			return { gameId, playerId, roundId: round.id };
		};

		const getSubmissions = async ({ roundId }: { roundId: RoundId }) =>
			await db
				.select()
				.from(submissionTable)
				.where(eq(submissionTable.roundId, roundId));

		test("提出を保存し、カードに提出を紐付ける", async () => {
			const { gameId, playerId, roundId } = await setupRound();

			const saved = await gameService.saveSubmission({
				gameId,
				playerId,
				position: "prefix",
				roundNo: 1,
				text: "カードA",
			});

			expect(saved).toEqual({ position: "prefix", text: "カードA" });
			const submissions = await getSubmissions({ roundId });
			expect(submissions).toHaveLength(1);

			const [cardA] = await db
				.select()
				.from(playerCardTable)
				.where(eq(playerCardTable.text, "カードA"));
			expect(cardA?.submissionId).toBe(submissions[0]?.id);
			expect(cardA?.roundId).toBe(roundId);
		});

		test("同一ラウンドで既に提出済みの場合は重複保存せず、既存の提出内容を返す", async () => {
			const { gameId, playerId, roundId } = await setupRound();

			await gameService.saveSubmission({
				gameId,
				playerId,
				position: "prefix",
				roundNo: 1,
				text: "カードA",
			});
			const saved = await gameService.saveSubmission({
				gameId,
				playerId,
				position: "suffix",
				roundNo: 1,
				text: "カードB",
			});

			expect(saved).toEqual({ position: "prefix", text: "カードA" });
			expect(await getSubmissions({ roundId })).toHaveLength(1);

			// 2回目の提出カードは使用済みにならない
			const [cardB] = await db
				.select()
				.from(playerCardTable)
				.where(eq(playerCardTable.text, "カードB"));
			expect(cardB?.submissionId).toBeNull();
			expect(cardB?.roundId).toBeNull();
		});

		test("同じ内容で再実行（リトライ）しても重複保存されない", async () => {
			const { gameId, playerId, roundId } = await setupRound();
			const params = {
				gameId,
				playerId,
				position: "suffix",
				roundNo: 1,
				text: "カードA",
			} as const;

			await gameService.saveSubmission(params);
			const saved = await gameService.saveSubmission(params);

			expect(saved).toEqual({ position: "suffix", text: "カードA" });
			expect(await getSubmissions({ roundId })).toHaveLength(1);
		});
	});
});
