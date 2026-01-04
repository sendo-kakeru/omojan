import { faker } from "@faker-js/faker";
import {
	type GameId,
	gameTable,
	type PlayerId,
	type PlayerSeat,
	playerCardTable,
	playerTable,
	type RoundId,
	type RoundNo,
	roundTable,
	roundThemeTable,
	type SubmissionId,
	submissionTable,
	userTable,
	voteTable,
} from "@repo/db/schema";
import { MOCK_USER } from "@repo/mock/model";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import type { BaseContext } from "../../types";
import { routes } from "./gameRoutes";

describe("gameRoutes", () => {
	const db = createTestDbClient();

	// Durable Objectをモック（/:gameIdのテストはDurable Objectに依存するためスキップ）
	const app = new Hono<BaseContext>()
		.use("*", async (c, next) => {
			c.set("db", db);
			await next();
		})
		.route("/v1/games", routes);
	const mockHonoClient = testClient<typeof app>(app);

	beforeEach(async () => {
		await db.delete(voteTable);
		await db.delete(playerCardTable);
		await db.delete(submissionTable);
		await db.delete(roundThemeTable);
		await db.delete(roundTable);
		await db.delete(playerTable);
		await db.delete(gameTable);
		await db.delete(userTable);
	});

	describe("GET /games/:gameId/result", () => {
		test("終了したゲームの結果を取得できる", async () => {
			// ユーザー作成
			const [user1] = await db
				.insert(userTable)
				.values({
					...MOCK_USER,
					sub: faker.string.uuid(),
				})
				.returning();

			// ゲーム作成（終了状態）
			const [game] = await db
				.insert(gameTable)
				.values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "テストゲーム",
				})
				.returning();

			// プレイヤー4人作成
			const playerData = [
				{ playerName: "Player1", seat: 1 as PlayerSeat, userId: user1?.id },
				{ playerName: "Player2", seat: 2 as PlayerSeat, userId: null },
				{ playerName: "Player3", seat: 3 as PlayerSeat, userId: null },
				{ playerName: "Player4", seat: 4 as PlayerSeat, userId: null },
			];

			const players: { id: PlayerId; seat: PlayerSeat }[] = [];
			for (const data of playerData) {
				const [player] = await db
					.insert(playerTable)
					.values({
						gameId: game.id,
						gameTokenHash: faker.string.alphanumeric(64),
						...data,
					})
					.returning();
				if (player) {
					players.push({ id: player.id, seat: player.seat });
				}
			}

			// ラウンド1を作成
			const [round1] = await db
				.insert(roundTable)
				.values({
					gameId: game.id,
					roundNo: 1 as RoundNo,
				})
				.returning();

			// テーマ作成
			await db.insert(roundThemeTable).values({
				roundId: round1.id,
				text: "テスト",
			});

			// 提出作成
			const submissionData: {
				playerId: PlayerId;
				roundId: RoundId;
				cardText: string;
				position: "prefix" | "suffix";
			}[] = [];
			for (const player of players) {
				submissionData.push({
					cardText: `カード${player.seat}`,
					playerId: player.id,
					position: player.seat % 2 === 0 ? "prefix" : "suffix",
					roundId: round1.id,
				});
			}

			const submissions: { id: SubmissionId; playerId: PlayerId }[] = [];
			for (const data of submissionData) {
				const [submission] = await db
					.insert(submissionTable)
					.values({
						playerId: data.playerId,
						position: data.position,
						roundId: data.roundId,
					})
					.returning();
				if (submission) {
					submissions.push({
						id: submission.id,
						playerId: submission.playerId,
					});

					// プレイヤーカード作成（提出と紐付け）
					await db.insert(playerCardTable).values({
						playerId: data.playerId,
						roundId: data.roundId,
						submissionId: submission.id,
						text: data.cardText,
					});
				}
			}

			// 投票作成（Player1の提出に3票、他は0票）
			const player1Submission = submissions.find(
				(s) => s.playerId === players[0]?.id,
			);
			if (player1Submission) {
				for (let i = 1; i < players.length; i++) {
					const player = players[i];
					if (player) {
						await db.insert(voteTable).values({
							playerId: player.id,
							roundId: round1.id,
							submissionId: player1Submission.id,
						});
					}
				}
			}

			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: game.id },
			});

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data).toBeDefined();
			expect(body.data?.title).toBe("テストゲーム");
			expect(body.data?.rounds).toHaveLength(1);
			expect(body.data?.rounds[0]?.roundNo).toBe(1);
			expect(body.data?.rounds[0]?.theme).toBe("テスト");
			expect(body.data?.rounds[0]?.players).toHaveLength(4);

			// Player1が勝者
			const player1Result = body.data?.rounds[0]?.players.find(
				(p) => p.id === players[0]?.id,
			);
			expect(player1Result?.isWinner).toBe(true);

			// 他のプレイヤーは勝者ではない
			const otherPlayers = body.data?.rounds[0]?.players.filter(
				(p) => p.id !== players[0]?.id,
			);
			for (const player of otherPlayers ?? []) {
				expect(player.isWinner).toBe(false);
			}

			// 最終勝者
			expect(body.data?.winners).toHaveLength(1);
			expect(body.data?.winners[0]?.id).toBe(players[0]?.id);
			expect(body.data?.winners[0]?.winCount).toBe(1);
		});

		test("複数ラウンドで同点の場合、複数の勝者が返される", async () => {
			const [game] = await db
				.insert(gameTable)
				.values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "同点ゲーム",
				})
				.returning();

			// プレイヤー4人作成
			const players: { id: PlayerId; seat: PlayerSeat }[] = [];
			for (let i = 1; i <= 4; i++) {
				const [player] = await db
					.insert(playerTable)
					.values({
						gameId: game.id,
						gameTokenHash: faker.string.alphanumeric(64),
						playerName: `Player${i}`,
						seat: i as PlayerSeat,
						userId: null,
					})
					.returning();
				if (player) {
					players.push({ id: player.id, seat: player.seat });
				}
			}

			// 2ラウンド作成
			const rounds: { id: RoundId; roundNo: RoundNo }[] = [];
			for (let roundNo = 1; roundNo <= 2; roundNo++) {
				const [round] = await db
					.insert(roundTable)
					.values({
						gameId: game.id,
						roundNo: roundNo as RoundNo,
					})
					.returning();
				if (round) {
					rounds.push({ id: round.id, roundNo: round.roundNo });

					await db.insert(roundThemeTable).values({
						roundId: round.id,
						text: `テーマ${roundNo}`,
					});
				}
			}

			// 各ラウンドの提出と投票を作成
			for (const round of rounds) {
				const submissions: { id: SubmissionId; playerId: PlayerId }[] = [];
				for (const player of players) {
					const [submission] = await db
						.insert(submissionTable)
						.values({
							playerId: player.id,
							position: "suffix",
							roundId: round.id,
						})
						.returning();
					if (submission) {
						submissions.push({
							id: submission.id,
							playerId: submission.playerId,
						});

						await db.insert(playerCardTable).values({
							playerId: player.id,
							roundId: round.id,
							submissionId: submission.id,
							text: "カード",
						});
					}
				}

				// ラウンド1: Player1が勝者、ラウンド2: Player2が勝者
				const winnerIndex = round.roundNo === 1 ? 0 : 1;
				const winnerSubmission = submissions.find(
					(s) => s.playerId === players[winnerIndex]?.id,
				);
				if (winnerSubmission) {
					for (let i = 0; i < players.length; i++) {
						if (i !== winnerIndex) {
							const player = players[i];
							if (player) {
								await db.insert(voteTable).values({
									playerId: player.id,
									roundId: round.id,
									submissionId: winnerSubmission.id,
								});
							}
						}
					}
				}
			}

			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: game.id },
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			// Player1とPlayer2が同点で勝者
			expect(body.data?.winners).toHaveLength(2);
			const winnerIds = body.data?.winners.map((w) => w.id);
			expect(winnerIds).toContain(players[0]?.id);
			expect(winnerIds).toContain(players[1]?.id);
		});

		test("存在しないゲームIDの場合、404を返す", async () => {
			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: faker.string.uuid() as GameId },
			});

			expect(response.status).toBe(404);
		});

		test("終了していないゲームの場合、409を返す", async () => {
			const [game] = await db
				.insert(gameTable)
				.values({
					isPrivate: false,
					password: null,
					status: "active",
					timeLimit: 30,
					title: "進行中ゲーム",
				})
				.returning();

			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: game.id },
			});

			expect(response.status).toBe(409);
		});

		test("提出テキストがテーマとカードの組み合わせで正しく生成される", async () => {
			const [game] = await db
				.insert(gameTable)
				.values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "提出テストゲーム",
				})
				.returning();

			const [player] = await db
				.insert(playerTable)
				.values({
					gameId: game.id,
					gameTokenHash: faker.string.alphanumeric(64),
					playerName: "Player1",
					seat: 1 as PlayerSeat,
					userId: null,
				})
				.returning();

			const [round] = await db
				.insert(roundTable)
				.values({
					gameId: game.id,
					roundNo: 1 as RoundNo,
				})
				.returning();

			await db.insert(roundThemeTable).values({
				roundId: round.id,
				text: "うどん",
			});

			// prefix提出（カード + テーマ）
			const [submission] = await db
				.insert(submissionTable)
				.values({
					playerId: player.id,
					position: "prefix",
					roundId: round.id,
				})
				.returning();

			await db.insert(playerCardTable).values({
				playerId: player.id,
				roundId: round.id,
				submissionId: submission.id,
				text: "讃岐",
			});

			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: game.id },
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			// prefix: カード + テーマ = "讃岐うどん"
			expect(body.data?.rounds[0]?.players[0]?.submission).toBe("讃岐うどん");
		});

		test("suffix提出の場合、テーマ + カードの順になる", async () => {
			const [game] = await db
				.insert(gameTable)
				.values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "suffix提出テスト",
				})
				.returning();

			const [player] = await db
				.insert(playerTable)
				.values({
					gameId: game.id,
					gameTokenHash: faker.string.alphanumeric(64),
					playerName: "Player1",
					seat: 1 as PlayerSeat,
					userId: null,
				})
				.returning();

			const [round] = await db
				.insert(roundTable)
				.values({
					gameId: game.id,
					roundNo: 1 as RoundNo,
				})
				.returning();

			await db.insert(roundThemeTable).values({
				roundId: round.id,
				text: "東京",
			});

			// suffix提出（テーマ + カード）
			const [submission] = await db
				.insert(submissionTable)
				.values({
					playerId: player.id,
					position: "suffix",
					roundId: round.id,
				})
				.returning();

			await db.insert(playerCardTable).values({
				playerId: player.id,
				roundId: round.id,
				submissionId: submission.id,
				text: "タワー",
			});

			const response = await mockHonoClient.v1.games[":gameId"].result.$get({
				param: { gameId: game.id },
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			// suffix: テーマ + カード = "東京タワー"
			expect(body.data?.rounds[0]?.players[0]?.submission).toBe("東京タワー");
		});
	});
});
