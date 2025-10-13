import { faker } from "@faker-js/faker";
import { gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { userTable } from "@repo/db/schema/user";
import { MOCK_USER } from "@repo/mock/model";
import type { CreateRoomRequestBody } from "@repo/shared/model/room";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import type { HybridRouteContext } from "../../types";
import { routes } from "./roomRoutes";

describe("roomRoutes", () => {
	const db = drizzle(process.env.DATABASE_URL, { casing: "snake_case" });

	describe("認証済みユーザー", () => {
		const app = new Hono<HybridRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				c.set("sub", MOCK_USER.sub);
				await next();
			})
			.route("/rooms", routes);
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

			test("認証済みユーザーがルームを作成した場合、201とゲームIDを返す", async () => {
				const [insertedUser] = await db
					.insert(userTable)
					.values(MOCK_USER)
					.returning();

				const response = await mockHonoClient.rooms.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.gameId).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.gameId));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);
				expect(createdGame?.timeLimit).toBe(MOCK_REQUEST_BODY.timeLimit);
				expect(createdGame?.isPrivate).toBe(MOCK_REQUEST_BODY.isPrivate);
				expect(createdGame?.status).toBe("waiting");

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data.gameId));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBe(insertedUser?.id);
			});

			test("プライベートルームを作成できる", async () => {
				await db.insert(userTable).values(MOCK_USER);

				const privateRoomBody: CreateRoomRequestBody = {
					...MOCK_REQUEST_BODY,
					isPrivate: true,
				};

				const response = await mockHonoClient.rooms.$post({
					json: privateRoomBody,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data?.gameId).toBeDefined();

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.gameId));
				expect(createdGame?.isPrivate).toBe(true);
				expect(createdGame?.password).toBeTypeOf("string");
			});

			test("バリデーションエラーの場合、400を返す", async () => {
				const invalidBody = {
					title: MOCK_REQUEST_BODY.title,
				} as unknown as CreateRoomRequestBody;

				const response = await mockHonoClient.rooms.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
			});

			test("時間制限が負の値の場合、400を返す", async () => {
				const invalidBody = {
					...MOCK_REQUEST_BODY,
					timeLimit: -1,
				} as CreateRoomRequestBody;

				const response = await mockHonoClient.rooms.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
			});
		});

		describe("GET /rooms", () => {
			test("待機中のルーム一覧を取得できる", async () => {
				await db.insert(userTable).values(MOCK_USER);

				const [insertedUser] = await db
					.select()
					.from(userTable)
					.where(eq(userTable.sub, MOCK_USER.sub));

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

				const createdGames = await Promise.all(
					gameData.map(async (data) => {
						const [game] = await db.insert(gameTable).values(data).returning();
						return game;
					}),
				);

				await Promise.all(
					createdGames.slice(0, 2).map(async (game, index) => {
						if (!game) return;
						await db.insert(playerTable).values({
							gameId: game.id,
							isHost: true,
							playerName: `Player ${index + 1}`,
							seat: 1,
							userId: insertedUser?.id,
						});
					}),
				);

				const response = await mockHonoClient.rooms.$get({});

				expect(response.status).toBe(200);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.length).toBe(2);

				const [room1, room2] = body.data || [];
				expect(room1?.title).toBe("Room 2");
				expect(room1?.isPrivate).toBe(true);
				expect(room1?.players.length).toBe(1);

				expect(room2?.title).toBe("Room 1");
				expect(room2?.isPrivate).toBe(false);
				expect(room2?.players.length).toBe(1);
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
			.route("/rooms", routes);
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
				const response = await mockHonoClient.rooms.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.gameId).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.gameId));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data.gameId));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBeNull();
			});
		});
	});
});
