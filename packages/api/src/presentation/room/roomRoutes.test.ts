import { faker } from "@faker-js/faker";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import type { CreateRoomRequestBody } from "@repo/db/models";
import {
	type GameId,
	gameCounterTable,
	gameTable,
	type PlayerSeat,
	playerTable,
	type RoundNo,
	roundTable,
	submissionTable,
	userTable,
	voteTable,
} from "@repo/db/schemas";
import { MOCK_USER } from "@repo/mock/model";
import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import { CleanupService } from "../../application/cleanup/CleanupService";
import { GameService } from "../../application/game/GameService";
import { MeService } from "../../application/me/MeService";
import type { HybridRouteContext } from "../../types";
import { routes } from "./roomRoutes";

const hashGameToken = (token: string): string => {
	const encoder = new TextEncoder();
	const hash = sha256(encoder.encode(token)); // Uint8Array
	return bytesToHex(hash);
};

describe("roomRoutes", () => {
	const db = createTestDbClient();

	describe("認証済みユーザー", () => {
		const app = new Hono<HybridRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				const foundResult = await new MeService(db).findBySub({
					sub: MOCK_USER.sub,
				});
				c.set(
					"auth",
					foundResult?.status === "active"
						? { me: foundResult.me, sub: MOCK_USER.sub }
						: null,
				);
				await next();
			})
			.onError(honoErrorHandler)
			.route("/v1/rooms", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
			await db.delete(voteTable);
			await db.delete(submissionTable);
			await db.delete(roundTable);
			await db.delete(playerTable);
			await db.delete(gameTable);
			await db.delete(userTable);
			await db.delete(gameCounterTable);
			await db
				.insert(gameCounterTable)
				.values({ count: 0, status: "finished" });
		});

		describe("POST /rooms", () => {
			const MOCK_REQUEST_BODY: CreateRoomRequestBody = {
				isPrivate: false,
				playerName: MOCK_USER.name,
				timeLimit: 30,
				title: faker.lorem.words(3),
			};

			test("認証済みユーザーがルームを作成した場合、201とゲームID、トークンを返す", async () => {
				const [insertedUser] = await db
					.insert(userTable)
					.values(MOCK_USER)
					.returning();

				const response = await mockHonoClient.v1.rooms.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.token).toBeDefined();
				expect(body.data?.gameId).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data?.gameId as GameId));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);
				expect(createdGame?.timeLimit).toBe(MOCK_REQUEST_BODY.timeLimit);
				expect(createdGame?.isPrivate).toBe(MOCK_REQUEST_BODY.isPrivate);
				expect(createdGame?.status).toBe("waiting");

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data?.gameId as GameId));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBe(insertedUser?.id);
				const expectedHash = hashGameToken(body.data?.token ?? "");
				expect(createdPlayer?.gameTokenHash).toBe(expectedHash);
			});

			test("プライベートルームを作成できる", async () => {
				await db.insert(userTable).values(MOCK_USER);

				const privateRoomBody: CreateRoomRequestBody = {
					...MOCK_REQUEST_BODY,
					isPrivate: true,
				};

				const response = await mockHonoClient.v1.rooms.$post({
					json: privateRoomBody,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data?.gameId).toBeDefined();

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data?.gameId as GameId));
				expect(createdGame?.isPrivate).toBe(true);
				expect(createdGame?.password).toBeTypeOf("string");
			});

			test("バリデーションエラーの場合、400を返す", async () => {
				const invalidBody = {
					title: MOCK_REQUEST_BODY.title,
				} as unknown as CreateRoomRequestBody;

				const response = await mockHonoClient.v1.rooms.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
			});

			test("時間制限が負の値の場合、400を返す", async () => {
				const invalidBody = {
					...MOCK_REQUEST_BODY,
					timeLimit: -1,
				} as CreateRoomRequestBody;

				const response = await mockHonoClient.v1.rooms.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
			});
		});

		describe("GET /rooms/:gameId", () => {
			test("有効なトークンでルームを単体取得できる", async () => {
				const gameToken = "valid-game-token";
				const gameTokenHash = hashGameToken(gameToken);

				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Test Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash,
					playerName: "Player",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].$get({
					header: { "x-game-token": gameToken },
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.title).toBe("Test Room");
				expect(body.data?.timeLimit).toBe(30);
				expect(body.data?.isPrivate).toBe(false);
				expect(body.data?.password).toBeNull();
			});

			test("有効なトークンでプライベートルームのパスワードを取得できる", async () => {
				const gameToken = "valid-game-token";
				const gameTokenHash = hashGameToken(gameToken);

				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: true,
						password: "secret",
						status: "waiting",
						timeLimit: 60,
						title: "Private Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash,
					playerName: "Player",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].$get({
					header: { "x-game-token": gameToken },
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.title).toBe("Private Room");
				expect(body.data?.isPrivate).toBe(true);
				expect(body.data?.password).toBe("secret");
			});

			test("無効なトークンの場合は403を返す", async () => {
				const validGameToken = "valid-game-token";
				const invalidGameToken = "invalid-game-token";
				const gameTokenHash = hashGameToken(validGameToken);

				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Test Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash,
					playerName: "Player",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].$get({
					header: { "x-game-token": invalidGameToken },
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(403);
			});

			test("存在しないルームIDの場合は404を返す", async () => {
				const gameToken = "some-token";

				const response = await mockHonoClient.v1.rooms[":gameId"].$get({
					header: { "x-game-token": gameToken },
					param: { gameId: faker.string.uuid() },
				});

				expect(response.status).toBe(404);
			});

			test("X-Game-Tokenヘッダーがない場合は400を返す", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Test Room",
					})
					.returning();

				const response = await app.request(`/v1/rooms/${createdGame.id}`, {
					method: "GET",
				});

				expect(response.status).toBe(400);
			});
		});

		describe("GET /rooms", () => {
			test("待機中のルーム一覧を取得できる", async () => {
				const gameData = [
					{
						isPrivate: false,
						password: null,
						status: "waiting" as const,
						timeLimit: 30,
						title: "Room 1",
					},
					{
						isPrivate: true,
						password: "secret",
						status: "waiting" as const,
						timeLimit: 60,
						title: "Room 2",
					},
				];

				for (const data of gameData) {
					await mockHonoClient.v1.rooms.$post({
						json: { ...data, playerName: "Player" },
					});
				}

				const response = await mockHonoClient.v1.rooms.$get({
					query: {},
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				const data = body.data;
				expect(data).toBeDefined();
				expect(data?.items?.length).toBe(2);
				expect(data?.meta).toEqual({
					limit: 20,
					page: 1,
					total: 2,
					totalPages: 1,
				});

				// 新しい順（Room 2 → Room 1）
				expect(data?.items?.[0].title).toBe(gameData[1].title);
				expect(data?.items?.[0].isPrivate).toBe(gameData[1].isPrivate);
				expect(data?.items?.[0].players.length).toBe(1);

				expect(data?.items?.[1].title).toBe(gameData[0].title);
				expect(data?.items?.[1].isPrivate).toBe(gameData[0].isPrivate);
				expect(data?.items?.[1].players.length).toBe(1);
			});

			test("status=waitingで募集中のルームのみ取得できる", async () => {
				// 募集中ルーム
				const [waitingGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Waiting Room",
					})
					.returning();
				await db.insert(playerTable).values({
					gameId: waitingGame.id,
					gameTokenHash: hashGameToken("token-1"),
					playerName: "Player 1",
					seat: 1,
					userId: null,
				});

				// アクティブなルーム（募集中ではない）
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "active",
					timeLimit: 30,
					title: "Active Room",
				});

				// 終了済みルーム
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "Finished Room",
				});

				const response = await mockHonoClient.v1.rooms.$get({
					query: { status: "waiting" },
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items?.length).toBe(1);
				expect(body.data?.items?.[0].title).toBe("Waiting Room");
			});

			test("プレイヤーが席順で返る", async () => {
				const [game] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Seat Order Room",
					})
					.returning();

				// 席順と異なる順序で登録し、レスポンスが席順に並び替えられることを確認する
				await db.insert(playerTable).values([
					{
						gameId: game.id,
						gameTokenHash: hashGameToken("token-seat-3"),
						playerName: "Player 3",
						seat: 3 as PlayerSeat,
						userId: null,
					},
					{
						gameId: game.id,
						gameTokenHash: hashGameToken("token-seat-1"),
						playerName: "Player 1",
						seat: 1 as PlayerSeat,
						userId: null,
					},
					{
						gameId: game.id,
						gameTokenHash: hashGameToken("token-seat-2"),
						playerName: "Player 2",
						seat: 2 as PlayerSeat,
						userId: null,
					},
				]);

				const response = await mockHonoClient.v1.rooms.$get({
					query: { status: "waiting" },
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				const room = body.data?.items?.find(
					(item) => item.title === "Seat Order Room",
				);
				expect(room?.players.map((player) => player.playerName)).toEqual([
					"Player 1",
					"Player 2",
					"Player 3",
				]);
			});

			test("ページネーションが正しく動作する", async () => {
				// 5つのルームを作成
				for (let i = 1; i <= 5; i++) {
					const [game] = await db
						.insert(gameTable)
						.values({
							isPrivate: false,
							password: null,
							status: "waiting",
							timeLimit: 30,
							title: `Room ${i}`,
						})
						.returning();
					await db.insert(playerTable).values({
						gameId: game.id,
						gameTokenHash: hashGameToken(`token-${i}`),
						playerName: `Player ${i}`,
						seat: 1,
						userId: null,
					});
				}

				// 1ページ目（limit=2）
				const response1 = await app.request("/v1/rooms?limit=2&page=1");
				expect(response1.status).toBe(200);
				const body1 = await response1.json();
				expect(body1.data?.items?.length).toBe(2);
				expect(body1.data?.meta).toEqual({
					limit: 2,
					page: 1,
					total: 5,
					totalPages: 3,
				});

				// 2ページ目
				const response2 = await app.request("/v1/rooms?limit=2&page=2");
				expect(response2.status).toBe(200);
				const body2 = await response2.json();
				expect(body2.data?.items?.length).toBe(2);
				expect(body2.data?.meta?.page).toBe(2);

				// 3ページ目（残り1件）
				const response3 = await app.request("/v1/rooms?limit=2&page=3");
				expect(response3.status).toBe(200);
				const body3 = await response3.json();
				expect(body3.data?.items?.length).toBe(1);
				expect(body3.data?.meta?.page).toBe(3);
			});

			test("無効なlimitの場合は400を返す", async () => {
				// 非数値
				const response1 = await app.request("/v1/rooms?limit=abc");
				expect(response1.status).toBe(400);

				// 0以下
				const response2 = await app.request("/v1/rooms?limit=0");
				expect(response2.status).toBe(400);

				// 上限超過
				const response3 = await app.request("/v1/rooms?limit=101");
				expect(response3.status).toBe(400);
			});

			test("無効なpageの場合は400を返す", async () => {
				// 非数値
				const response1 = await app.request("/v1/rooms?page=abc");
				expect(response1.status).toBe(400);

				// 0以下
				const response2 = await app.request("/v1/rooms?page=0");
				expect(response2.status).toBe(400);

				// 負の値
				const response3 = await app.request("/v1/rooms?page=-1");
				expect(response3.status).toBe(400);
			});

			test("ルームが存在しない場合、空配列を返す", async () => {
				const response = await mockHonoClient.v1.rooms.$get({
					query: {},
				});

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items).toEqual([]);
				expect(body.data?.meta).toEqual({
					limit: 20,
					page: 1,
					total: 0,
					totalPages: 0,
				});
			});

			test("status=finishedで終了済みルームを取得できる", async () => {
				// 終了済みルームを作成
				const [finishedGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "finished",
						timeLimit: 30,
						title: "Finished Room",
					})
					.returning();

				// プレイヤーを作成
				const players = await db
					.insert(playerTable)
					.values([
						{
							gameId: finishedGame.id,
							gameTokenHash: hashGameToken("token-1"),
							playerName: "Winner Player",
							seat: 1 as PlayerSeat,
							userId: null,
						},
						{
							gameId: finishedGame.id,
							gameTokenHash: hashGameToken("token-2"),
							playerName: "Loser Player",
							seat: 2 as PlayerSeat,
							userId: null,
						},
					])
					.returning();

				// ラウンドを作成
				const [round] = await db
					.insert(roundTable)
					.values({
						gameId: finishedGame.id,
						roundNo: 1 as RoundNo,
					})
					.returning();

				// 提出を作成
				const submissions = await db
					.insert(submissionTable)
					.values([
						{
							playerId: players[0].id,
							position: "prefix",
							roundId: round.id,
						},
						{
							playerId: players[1].id,
							position: "suffix",
							roundId: round.id,
						},
					])
					.returning();

				// 投票を作成（Player 1に2票、Player 2に0票）
				await db.insert(voteTable).values([
					{
						playerId: players[0].id,
						roundId: round.id,
						submissionId: submissions[0].id,
					},
					{
						playerId: players[1].id,
						roundId: round.id,
						submissionId: submissions[0].id,
					},
				]);

				const response = await app.request("/v1/rooms?status=finished");

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items?.length).toBe(1);

				const room = body.data?.items?.[0];
				expect(room?.title).toBe("Finished Room");
				expect(room?.players?.length).toBe(2);

				// 勝者の確認
				type FinishedPlayer = { playerName: string; isWinner: boolean };
				const winnerPlayer = room?.players?.find(
					(p: FinishedPlayer) => p.playerName === "Winner Player",
				);
				const loserPlayer = room?.players?.find(
					(p: FinishedPlayer) => p.playerName === "Loser Player",
				);
				expect(winnerPlayer?.isWinner).toBe(true);
				expect(loserPlayer?.isWinner).toBe(false);
			});

			test("終了済みルームで複数ラウンドの勝者を正しく計算する", async () => {
				const [finishedGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "finished",
						timeLimit: 30,
						title: "Multi Round Game",
					})
					.returning();

				const players = await db
					.insert(playerTable)
					.values([
						{
							gameId: finishedGame.id,
							gameTokenHash: hashGameToken("token-1"),
							playerName: "Player A",
							seat: 1 as PlayerSeat,
							userId: null,
						},
						{
							gameId: finishedGame.id,
							gameTokenHash: hashGameToken("token-2"),
							playerName: "Player B",
							seat: 2 as PlayerSeat,
							userId: null,
						},
					])
					.returning();

				// 3ラウンド作成
				const rounds = await db
					.insert(roundTable)
					.values([
						{ gameId: finishedGame.id, roundNo: 1 as RoundNo },
						{ gameId: finishedGame.id, roundNo: 2 as RoundNo },
						{ gameId: finishedGame.id, roundNo: 3 as RoundNo },
					])
					.returning();

				// 各ラウンドで提出と投票を作成
				for (let i = 0; i < 3; i++) {
					const submissions = await db
						.insert(submissionTable)
						.values([
							{
								playerId: players[0].id,
								position: "prefix",
								roundId: rounds[i].id,
							},
							{
								playerId: players[1].id,
								position: "suffix",
								roundId: rounds[i].id,
							},
						])
						.returning();

					// ラウンド1,2はPlayer A勝利、ラウンド3はPlayer B勝利
					const winnerSubmissionIndex = i < 2 ? 0 : 1;
					await db.insert(voteTable).values([
						{
							playerId: players[0].id,
							roundId: rounds[i].id,
							submissionId: submissions[winnerSubmissionIndex].id,
						},
						{
							playerId: players[1].id,
							roundId: rounds[i].id,
							submissionId: submissions[winnerSubmissionIndex].id,
						},
					]);
				}

				const response = await app.request("/v1/rooms?status=finished");

				expect(response.status).toBe(200);
				const body = await response.json();
				const room = body.data?.items?.[0];

				// Player Aが2勝、Player Bが1勝なのでPlayer Aが勝者
				type FinishedPlayer = { playerName: string; isWinner: boolean };
				const playerA = room?.players?.find(
					(p: FinishedPlayer) => p.playerName === "Player A",
				);
				const playerB = room?.players?.find(
					(p: FinishedPlayer) => p.playerName === "Player B",
				);
				expect(playerA?.isWinner).toBe(true);
				expect(playerB?.isWinner).toBe(false);
			});

			test("終了済みルームのページネーションが正しく動作する", async () => {
				// 対戦中のルームを3つ作成し、ゲーム終了処理で終了済みにする
				const gameService = new GameService(db);
				for (let i = 1; i <= 3; i++) {
					const [game] = await db
						.insert(gameTable)
						.values({
							isPrivate: false,
							password: null,
							status: "active",
							timeLimit: 30,
							title: `Finished Room ${i}`,
						})
						.returning({ id: gameTable.id });
					await gameService.endGame({ gameId: game.id });
				}

				const response = await app.request(
					"/v1/rooms?status=finished&limit=2&page=1",
				);

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items?.length).toBe(2);
				expect(body.data?.meta).toEqual({
					limit: 2,
					page: 1,
					total: 3,
					totalPages: 2,
				});
			});

			test("ゲーム終了とクリーンアップを経た総件数が終了済みルームの実件数と一致する", async () => {
				const gameService = new GameService(db);

				// 4人参加のルーム3つと、クリーンアップで削除される1人参加のルーム1つを終了させる
				for (const [index, playerCount] of [4, 4, 4, 1].entries()) {
					const [game] = await db
						.insert(gameTable)
						.values({
							isPrivate: false,
							password: null,
							status: "active",
							timeLimit: 30,
							title: `Finished Room ${index + 1}`,
						})
						.returning({ id: gameTable.id });
					await db.insert(playerTable).values(
						Array.from({ length: playerCount }, (_, seatIndex) => ({
							gameId: game.id,
							gameTokenHash: hashGameToken(`token-${index}-${seatIndex}`),
							playerName: `Player ${seatIndex + 1}`,
							seat: (seatIndex + 1) as PlayerSeat,
							userId: null,
						})),
					);
					await gameService.endGame({ gameId: game.id });
					// 同じゲームに対する重複呼び出し
					await gameService.endGame({ gameId: game.id });
				}

				await new CleanupService(db).runAll();

				const response = await app.request(
					"/v1/rooms?status=finished&limit=2&page=1",
				);

				expect(response.status).toBe(200);
				const body = await response.json();
				const [finishedCount] = await db
					.select({ count: count() })
					.from(gameTable)
					.where(eq(gameTable.status, "finished"));
				expect(finishedCount?.count).toBe(3);
				expect(body.data?.meta).toEqual({
					limit: 2,
					page: 1,
					total: finishedCount?.count,
					totalPages: 2,
				});
			});

			test("絞り込みなしの総件数はカウンターから取得する", async () => {
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "Finished Room",
				});
				// 実際の件数（1件）とは異なる値をカウンターに設定する
				await db
					.update(gameCounterTable)
					.set({ count: 45 })
					.where(eq(gameCounterTable.status, "finished"));

				const response = await app.request(
					"/v1/rooms?status=finished&limit=20&page=1",
				);

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items?.length).toBe(1);
				expect(body.data?.meta).toEqual({
					limit: 20,
					page: 1,
					total: 45,
					totalPages: 3,
				});
			});

			test("userId指定ありの総件数はカウンターを使わずに数える", async () => {
				const [user] = await db.insert(userTable).values(MOCK_USER).returning();

				// ユーザーが参加した終了済みルーム2件と、参加していない終了済みルーム1件
				for (let i = 1; i <= 3; i++) {
					const [game] = await db
						.insert(gameTable)
						.values({
							isPrivate: false,
							password: null,
							status: "finished",
							timeLimit: 30,
							title: `Finished Room ${i}`,
						})
						.returning();
					await db.insert(playerTable).values({
						gameId: game.id,
						gameTokenHash: hashGameToken(`token-${i}`),
						playerName: `Player ${i}`,
						seat: 1 as PlayerSeat,
						userId: i <= 2 ? user.id : null,
					});
				}
				await db
					.update(gameCounterTable)
					.set({ count: 45 })
					.where(eq(gameCounterTable.status, "finished"));

				const response = await app.request(
					`/v1/rooms?status=finished&limit=1&page=1&userId=${user.id}`,
				);

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.items?.length).toBe(1);
				expect(body.data?.meta).toEqual({
					limit: 1,
					page: 1,
					total: 2,
					totalPages: 2,
				});
			});
		});

		describe("GET /rooms/count", () => {
			test("status=activeで対戦中のルーム件数を取得できる", async () => {
				// 募集中ルーム
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "waiting",
					timeLimit: 30,
					title: "Waiting Room",
				});

				// 対戦中ルーム
				const [activeGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "active",
						timeLimit: 30,
						title: "Active Room",
					})
					.returning();
				await db.insert(playerTable).values({
					gameId: activeGame.id,
					gameTokenHash: hashGameToken("token-1"),
					playerName: "Player 1",
					seat: 1 as PlayerSeat,
					userId: null,
				});

				// 終了済みルーム
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "finished",
					timeLimit: 30,
					title: "Finished Room",
				});

				const response = await app.request("/v1/rooms/count?status=active");

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.count).toBe(1);
			});

			test("対戦中のルームが無い場合は0を返す", async () => {
				await db.insert(gameTable).values({
					isPrivate: false,
					password: null,
					status: "waiting",
					timeLimit: 30,
					title: "Waiting Room",
				});

				const response = await app.request("/v1/rooms/count?status=active");

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data?.count).toBe(0);
			});
		});

		describe("POST /rooms/:gameId/join", () => {
			test("既に同じユーザーが参加している場合は201を返す", async () => {
				const [insertedUser] = await db
					.insert(userTable)
					.values(MOCK_USER)
					.returning();

				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 45,
						title: "Duplicated Room",
					})
					.returning();

				const hostTokenHash = hashGameToken("host-token");
				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hostTokenHash,
					playerName: "Host",
					seat: 1,
					userId: insertedUser?.id ?? null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Dup Player",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(201);
			});

			test("保持トークンが既に登録済みの場合は201を返す", async () => {
				const [insertedUser] = await db
					.insert(userTable)
					.values(MOCK_USER)
					.returning();

				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 45,
						title: "Rejoin Room",
					})
					.returning();

				const heldToken = "existing-token";
				const hostTokenHash = hashGameToken("host-token");
				const heldTokenHash = hashGameToken(heldToken);

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hostTokenHash,
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: heldTokenHash,
					playerName: "Existing Player",
					seat: 2,
					userId: insertedUser?.id ?? null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken,
						playerName: "Rejoin Player",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(201);
			});
		});
	});
	describe("未認証ユーザー", () => {
		const app = new Hono<HybridRouteContext>()
			.use("*", async (c, next) => {
				c.set("auth", null);
				c.set("db", db);
				await next();
			})
			.onError(honoErrorHandler)
			.route("/v1/rooms", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
			await db.delete(voteTable);
			await db.delete(submissionTable);
			await db.delete(roundTable);
			await db.delete(playerTable);
			await db.delete(gameTable);
			await db.delete(userTable);
		});

		describe("POST /rooms", () => {
			const MOCK_REQUEST_BODY: CreateRoomRequestBody = {
				isPrivate: false,
				playerName: faker.person.firstName(),
				timeLimit: 60,
				title: faker.lorem.words(3),
			};

			test("未認証ユーザーでもルームを作成できる", async () => {
				const response = await mockHonoClient.v1.rooms.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.gameId).toBeDefined();
				expect(body.data?.token).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data?.gameId as GameId));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data?.gameId as GameId));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBeNull();
				const expectedHash = hashGameToken(body.data?.token ?? "");
				expect(createdPlayer?.gameTokenHash).toBe(expectedHash);
			});
		});

		describe("POST /rooms/:gameId/join", () => {
			test("未認証ユーザーでもルームに参加できる", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Guest Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hashGameToken("host-token"),
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Guest",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(
					body.data && "token" in body.data && body.data.token,
				).toBeDefined();

				const createdPlayers = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, createdGame.id));
				const guestPlayer = createdPlayers.find(
					(player) => player.playerName === "Guest",
				);

				expect(guestPlayer).toBeDefined();
				expect(guestPlayer?.userId).toBeNull();
				const expectedHash = hashGameToken(
					body.data && "token" in body.data ? body.data.token : "",
				);
				expect(guestPlayer?.gameTokenHash).toBe(expectedHash);
				expect(guestPlayer?.seat).toBe(2);
			});

			test("4人目が参加したらゲームステータスがactiveになる", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 30,
						title: "Full Room",
					})
					.returning();

				await Promise.all(
					["Host", "Guest 1", "Guest 2"].map(async (playerName, index) => {
						await db.insert(playerTable).values({
							gameId: createdGame.id,
							gameTokenHash: hashGameToken(`token-${index}`),
							playerName,
							seat: (index + 1) as PlayerSeat,
							userId: null,
						});
					}),
				);

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Guest 3",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(201);

				const [updatedGame] = await db
					.select({ status: gameTable.status })
					.from(gameTable)
					.where(eq(gameTable.id, createdGame.id));

				expect(updatedGame?.status).toBe("active");
			});

			test("プライベートルームで誤ったパスワードを送信すると403を返す", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: true,
						password: "secret",
						status: "waiting",
						timeLimit: 60,
						title: "Private Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hashGameToken("host-token"),
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						password: "wrong1",
						playerName: "Intruder",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(403);
			});

			test("募集中以外のステータスの部屋には参加できない", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "active",
						timeLimit: 30,
						title: "Active Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hashGameToken("host-token"),
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Late Player",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(400);
			});

			test("満員のルームには参加できない", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: false,
						password: null,
						status: "waiting",
						timeLimit: 45,
						title: "Full Room",
					})
					.returning();

				await Promise.all(
					Array.from({ length: 4 }).map(async (_, index) => {
						const gameTokenHash = hashGameToken(`token-${index}`);
						await db.insert(playerTable).values({
							gameId: createdGame.id,
							gameTokenHash,
							playerName: `Player ${index + 1}`,
							seat: (index + 1) as PlayerSeat,
							userId: null,
						});
					}),
				);

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Latecomer",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(409);
			});

			test("存在しないルームIDの場合は404を返す", async () => {
				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "Ghost",
					},
					param: { gameId: faker.string.uuid() },
				});

				expect(response.status).toBe(404);
			});

			test("プライベートルームでパスワード未入力の場合は400を返す", async () => {
				const [createdGame] = await db
					.insert(gameTable)
					.values({
						isPrivate: true,
						password: "secret",
						status: "waiting",
						timeLimit: 30,
						title: "Private Room",
					})
					.returning();

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: hashGameToken("host-token"),
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				const response = await mockHonoClient.v1.rooms[":gameId"].join.$post({
					json: {
						heldToken: null,
						playerName: "NoPass",
					},
					param: { gameId: createdGame.id },
				});

				expect(response.status).toBe(400);
			});
		});
	});
});
