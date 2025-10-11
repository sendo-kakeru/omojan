import { faker } from "@faker-js/faker";
import { userTable } from "@repo/db/schema/user";
import { MOCK_USER } from "@repo/mock/model";
import type { CreateMeRequestBody } from "@repo/shared/model/me";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import type { PrivateRouteContext } from "../../types";
import { routes } from "./meRoutes";

describe("meRoutes", () => {
	const db = drizzle(process.env.DATABASE_URL, { casing: "snake_case" });
	const app = new Hono<PrivateRouteContext>()
		.use("*", async (c, next) => {
			c.set("db", db);
			c.set("sub", MOCK_USER.sub);
			await next();
		})
		.route("/me", routes);
	const mockHonoClient = testClient<typeof app>(app);

	beforeEach(async () => {
		await db.delete(userTable);
	});

	describe("GET /me", () => {
		test("ユーザーが存在する場合、200とユーザー情報を返す", async () => {
			const [createdUser] = await db
				.insert(userTable)
				.values(MOCK_USER)
				.returning();

			const response = await mockHonoClient.me.$get();

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data).toBeDefined();
			expect(body.data?.email).toBe(MOCK_USER.email);
			expect(body.data?.name).toBe(MOCK_USER.name);
			expect(body.data?.image).toBe(MOCK_USER.image);
			expect(body.data?.userId).toBe(createdUser?.id);
			expect(body.message).toBe("OK");
		});

		test("ユーザーが存在しない場合、404を返す", async () => {
			const response = await mockHonoClient.me.$get();

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.data).toBeNull();
		});
	});

	describe("POST /me", () => {
		const MOCK_REQUEST_BODY: CreateMeRequestBody = {
			email: MOCK_USER.email,
			image: MOCK_USER.image,
			name: MOCK_USER.name,
		};
		test("正常にユーザーを作成した場合、201とユーザー情報を返す", async () => {
			const response = await mockHonoClient.me.$post({
				json: MOCK_REQUEST_BODY,
			});

			expect(response.status).toBe(201);
			const body = await response.json();
			expect(body.data).toBeDefined();
			expect(body.data?.email).toBe(MOCK_REQUEST_BODY.email);
			expect(body.data?.name).toBe(MOCK_REQUEST_BODY.name);
			expect(body.data?.image).toBe(MOCK_REQUEST_BODY.image);
			expect(body.data?.userId).toBeDefined();
			expect(body.message).toBe("Created");

			const [foundUser] = await db
				.select()
				.from(userTable)
				.where(eq(userTable.sub, MOCK_USER.sub));
			expect(foundUser).toBeDefined();
			expect(foundUser?.email).toBe(MOCK_REQUEST_BODY.email);
		});

		test("バリデーションエラーの場合、400を返す", async () => {
			const invalidBody = {
				email: "invalid-email",
			} as unknown as CreateMeRequestBody;

			const response = await mockHonoClient.me.$post({
				json: invalidBody,
			});

			expect(response.status).toBe(400);
		});

		test("subが既に存在する場合、409を返す", async () => {
			const firstResponse = await mockHonoClient.me.$post({
				json: MOCK_REQUEST_BODY,
			});
			expect(firstResponse.status).toBe(201);

			const secondResponse = await mockHonoClient.me.$post({
				json: { ...MOCK_REQUEST_BODY, email: faker.internet.email() },
			});

			expect(secondResponse.status).toBe(409);
		});

		test("emailが既に存在する場合、409を返す", async () => {
			const firstResponse = await mockHonoClient.me.$post({
				json: MOCK_REQUEST_BODY,
			});
			expect(firstResponse.status).toBe(201);

			const differentSubHonoClient = testClient<typeof app>(
				new Hono<PrivateRouteContext>()
					.use("*", async (c, next) => {
						c.set("db", db);
						c.set("sub", faker.string.uuid());
						await next();
					})
					.route("/me", routes),
			);

			const secondResponse = await differentSubHonoClient.me.$post({
				json: MOCK_REQUEST_BODY,
			});

			expect(secondResponse.status).toBe(409);
		});

		test("imageなしでもユーザーを作成できる", async () => {
			const response = await mockHonoClient.me.$post({
				json: { ...MOCK_REQUEST_BODY, image: null },
			});

			expect(response.status).toBe(201);
			const body = await response.json();
			expect(body.data).toBeDefined();
			expect(body.data?.image).toBeNull();
			expect(body.data?.email).toBe(MOCK_REQUEST_BODY.email);
			expect(body.data?.name).toBe(MOCK_REQUEST_BODY.name);
		});
	});
});
