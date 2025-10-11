import { faker } from "@faker-js/faker";
import { gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { userTable } from "@repo/db/schema/user";
import { MOCK_USER } from "@repo/mock/model";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import type { HybridRouteContext } from "../../types";
import type { CreateGameRequestBody } from "./gameRoutes";
import { routes } from "./gameRoutes";

describe("gameRoutes", () => {
	const db = drizzle(process.env.DATABASE_URL, { casing: "snake_case" });

	describe("認証済みユーザー", () => {
		const app = new Hono<HybridRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				c.set("sub", MOCK_USER.sub);
				await next();
			})
			.route("/game", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
			await db.delete(playerTable);
			await db.delete(gameTable);
			await db.delete(userTable);
		});

		describe("POST /game", () => {
			const MOCK_REQUEST_BODY: CreateGameRequestBody = {
				isPrivate: false,
				password: null,
				playerName: MOCK_USER.name,
				timeLimit: 30,
				title: faker.lorem.words(3),
			};

			test("認証済みユーザーがゲームを作成した場合、201とゲームIDを返す", async () => {
				const [insertedUser] = await db
					.insert(userTable)
					.values(MOCK_USER)
					.returning();

				const response = await mockHonoClient.game.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.id).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.id));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);
				expect(createdGame?.timeLimit).toBe(MOCK_REQUEST_BODY.timeLimit);
				expect(createdGame?.isPrivate).toBe(MOCK_REQUEST_BODY.isPrivate);
				expect(createdGame?.password).toBe(MOCK_REQUEST_BODY.password);
				expect(createdGame?.status).toBe("waiting");

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data.id));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBe(insertedUser?.id);
			});

			test("プライベートゲーム（パスワード付き）を作成できる", async () => {
				await db.insert(userTable).values(MOCK_USER);

				const privateGameBody: CreateGameRequestBody = {
					...MOCK_REQUEST_BODY,
					isPrivate: true,
					password: faker.internet.password(),
				};

				const response = await mockHonoClient.game.$post({
					json: privateGameBody,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data?.id).toBeDefined();

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.id));
				expect(createdGame?.isPrivate).toBe(true);
				expect(createdGame?.password).toBe(privateGameBody.password);
			});

			test("バリデーションエラーの場合、400を返す", async () => {
				const invalidBody = {
					title: MOCK_REQUEST_BODY.title,
				} as unknown as CreateGameRequestBody;

				const response = await mockHonoClient.game.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
			});

			test("時間制限が負の値の場合、400を返す", async () => {
				const invalidBody = {
					...MOCK_REQUEST_BODY,
					timeLimit: -1,
				} as CreateGameRequestBody;

				const response = await mockHonoClient.game.$post({
					json: invalidBody,
				});

				expect(response.status).toBe(400);
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
			.route("/game", routes);
		const mockHonoClient = testClient<typeof app>(app);

		beforeEach(async () => {
			await db.delete(playerTable);
			await db.delete(gameTable);
			await db.delete(userTable);
		});

		describe("POST /game", () => {
			const MOCK_REQUEST_BODY: CreateGameRequestBody = {
				isPrivate: false,
				password: null,
				playerName: faker.person.firstName(),
				timeLimit: 60,
				title: faker.lorem.words(3),
			};

			test("未認証ユーザーでもゲームを作成できる", async () => {
				const response = await mockHonoClient.game.$post({
					json: MOCK_REQUEST_BODY,
				});

				expect(response.status).toBe(201);
				const body = await response.json();
				expect(body.data).toBeDefined();
				expect(body.data?.id).toBeDefined();
				expect(body.message).toBe("OK");

				const [createdGame] = await db
					.select()
					.from(gameTable)
					.where(eq(gameTable.id, body.data.id));
				expect(createdGame).toBeDefined();
				expect(createdGame?.title).toBe(MOCK_REQUEST_BODY.title);

				const [createdPlayer] = await db
					.select()
					.from(playerTable)
					.where(eq(playerTable.gameId, body.data.id));
				expect(createdPlayer).toBeDefined();
				expect(createdPlayer?.playerName).toBe(MOCK_REQUEST_BODY.playerName);
				expect(createdPlayer?.isHost).toBe(true);
				expect(createdPlayer?.seat).toBe(1);
				expect(createdPlayer?.userId).toBeNull();
			});
		});
	});
});
