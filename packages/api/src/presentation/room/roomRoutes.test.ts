import { faker } from "@faker-js/faker";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
	gameTable,
	type PlayerSeat,
	playerTable,
	userTable,
} from "@repo/db/schema";
import { MOCK_USER } from "@repo/mock/model";
import type { CreateRoomRequestBody } from "@repo/shared/model/room";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
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
				c.set("sub", MOCK_USER.sub);
				await next();
			})
			.route("/v1/rooms", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
			await db.delete(playerTable);
			await db.delete(gameTable);
			await db.delete(userTable);
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
					.where(eq(gameTable.id, body.data?.gameId ?? ""));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);
				expect(createdGame?.timeLimit).toBe(MOCK_REQUEST_BODY.timeLimit);
				expect(createdGame?.isPrivate).toBe(MOCK_REQUEST_BODY.isPrivate);
				expect(createdGame?.status).toBe("waiting");

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data?.gameId ?? ""));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
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
					.where(eq(gameTable.id, body.data?.gameId ?? ""));
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
					{
						isPrivate: false,
						password: null,
						status: "active" as const,
						timeLimit: 45,
						title: "Room 3",
					},
				];

				for (const data of gameData) {
					await mockHonoClient.v1.rooms.$post({
						json: { ...data, playerName: "Player" },
					});
				}

				const response = await mockHonoClient.v1.rooms.$get();

				expect(response.status).toBe(200);
				const body = await response.json();
				const rooms = body.data;
				expect(rooms).toBeDefined();
				expect(rooms?.length).toBe(3);

				expect(rooms?.[0].title).toBe(gameData[2].title);
				expect(rooms?.[0].isPrivate).toBe(gameData[2].isPrivate);
				expect(rooms?.[0].players.length).toBe(1);

				expect(rooms?.[1].title).toBe(gameData[1].title);
				expect(rooms?.[1].isPrivate).toBe(gameData[1].isPrivate);
				expect(rooms?.[1].players.length).toBe(1);
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
					isHost: true,
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
					isHost: true,
					playerName: "Host",
					seat: 1,
					userId: null,
				});

				await db.insert(playerTable).values({
					gameId: createdGame.id,
					gameTokenHash: heldTokenHash,
					isHost: false,
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
				c.set("db", db);
				c.set("sub", null);
				await next();
			})
			.route("/v1/rooms", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
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
					.where(eq(gameTable.id, body.data?.gameId ?? ""));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data?.gameId ?? ""));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
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
					isHost: true,
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
					isHost: true,
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
					isHost: true,
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
							isHost: index === 0,
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
					isHost: true,
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
