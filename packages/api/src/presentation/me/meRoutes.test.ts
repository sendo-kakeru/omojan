import { faker } from "@faker-js/faker";
import type {
	CreateMeRequestBody,
	Me,
	UpdateMeRequestBody,
} from "@repo/db/model";
import { userTable } from "@repo/db/schema";
import { MOCK_ME, MOCK_USER } from "@repo/mock/model";
import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { eq } from "drizzle-orm";
import { type ExecutionContext, Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { createTestDbClient } from "../../__tests__/createTestDbClient";
import type {
	PrivateRouteContext,
	RegistrationRouteContext,
} from "../../types";
import { registrationRoutes, routes } from "./meRoutes";

describe("meRoutes", () => {
	const db = createTestDbClient();
	// 認証そのものは middleware/auth.test.ts が検証するため、ここでは値を置くだけ
	let currentMe: Me = MOCK_ME;
	const app = new Hono<PrivateRouteContext>()
		.use("*", async (c, next) => {
			c.set("auth", { me: currentMe, sub: MOCK_USER.sub });
			c.set("db", db);
			await next();
		})
		.onError(honoErrorHandler)
		.route("/v1/me", routes);
	const mockHonoClient = testClient<typeof app>(app);

	const buildRegistrationClient = (sub: string) =>
		testClient(
			new Hono<RegistrationRouteContext>()
				.use("*", async (c, next) => {
					c.set("auth", { sub });
					c.set("db", db);
					await next();
				})
				.onError(honoErrorHandler)
				.route("/v1/me", registrationRoutes),
		);
	const mockRegistrationClient = buildRegistrationClient(MOCK_USER.sub);

	beforeEach(async () => {
		currentMe = MOCK_ME;
		await db.delete(userTable);
	});

	describe("GET /me", () => {
		test("ユーザーが存在する場合、200とユーザー情報を返す", async () => {
			const [createdUser] = await db
				.insert(userTable)
				.values(MOCK_USER)
				.returning();

			const response = await mockHonoClient.v1.me.$get();

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.data).toBeDefined();
			expect(body.data?.email).toBe(MOCK_USER.email);
			expect(body.data?.name).toBe(MOCK_USER.name);
			expect(body.data?.image).toBe(MOCK_USER.image);
			expect(body.data?.userId).toBe(createdUser?.id);
			expect(body.message).toBe("OK");
		});
	});

	describe("POST /me", () => {
		const MOCK_REQUEST_BODY: CreateMeRequestBody = {
			email: MOCK_USER.email,
			image: MOCK_USER.image,
			name: MOCK_USER.name,
		};
		test("正常にユーザーを作成した場合、201とユーザー情報を返す", async () => {
			const response = await mockRegistrationClient.v1.me.$post({
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

			const response = await mockRegistrationClient.v1.me.$post({
				json: invalidBody,
			});

			expect(response.status).toBe(400);
		});

		test("subが既に存在する場合、409を返す", async () => {
			const firstResponse = await mockRegistrationClient.v1.me.$post({
				json: MOCK_REQUEST_BODY,
			});
			expect(firstResponse.status).toBe(201);

			const secondResponse = await mockRegistrationClient.v1.me.$post({
				json: { ...MOCK_REQUEST_BODY, email: faker.internet.email() },
			});

			expect(secondResponse.status).toBe(409);
		});

		test("emailが既に存在する場合、409を返す", async () => {
			const firstResponse = await mockRegistrationClient.v1.me.$post({
				json: MOCK_REQUEST_BODY,
			});
			expect(firstResponse.status).toBe(201);

			const differentSubClient = buildRegistrationClient(faker.string.uuid());

			const secondResponse = await differentSubClient.v1.me.$post({
				json: MOCK_REQUEST_BODY,
			});

			expect(secondResponse.status).toBe(409);
		});

		test("imageなしでもユーザーを作成できる", async () => {
			const response = await mockRegistrationClient.v1.me.$post({
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
	describe("PATCH /me", () => {
		beforeEach(async () => {
			await db.insert(userTable).values(MOCK_USER);
		});

		test("名前を更新した場合、200と更新後のユーザー情報を返す", async () => {
			const name = faker.person.fullName();

			const response = await mockHonoClient.v1.me.$patch({ json: { name } });

			expect(response.status).toBe(200);
			expect((await response.json()).data?.name).toBe(name);

			const [updatedUser] = await db
				.select()
				.from(userTable)
				.where(eq(userTable.id, MOCK_USER.id));
			expect(updatedUser?.name).toBe(name);
		});

		/**
		 * 旧画像の削除は CDN_WORKER と executionCtx を使うため、testClient ではなく app.request にスタブを渡して検証する。
		 */
		const patchWithCdn = async ({ body }: { body: UpdateMeRequestBody }) => {
			const cdnRequests: Request[] = [];
			const waitUntilPromises: Promise<unknown>[] = [];

			const response = await app.request(
				"/v1/me",
				{
					body: JSON.stringify(body),
					headers: { "Content-Type": "application/json" },
					method: "PATCH",
				},
				{
					CDN_WORKER: {
						fetch: async (request: Request): Promise<Response> => {
							cdnRequests.push(request);
							return new Response(null, { status: 204 });
						},
					},
				},
				{
					passThroughOnException: () => {},
					waitUntil: (promise: Promise<unknown>) => {
						waitUntilPromises.push(promise);
					},
				} as ExecutionContext,
			);
			await Promise.all(waitUntilPromises);

			return { cdnRequests, response };
		};

		/** 旧画像を DB と auth.me の両方に反映する（本番では常に一致する） */
		const setCurrentImage = async (image: string) => {
			currentMe = { ...MOCK_ME, image };
			await db
				.update(userTable)
				.set({ image })
				.where(eq(userTable.id, MOCK_USER.id));
		};

		test("画像を更新した場合、200と更新後のユーザー情報を返す", async () => {
			const image = "users/updated.webp";

			const { response } = await patchWithCdn({ body: { image } });

			expect(response.status).toBe(200);
			const body: { data: Me | null } = await response.json();
			expect(body.data?.image).toBe(image);

			const [updatedUser] = await db
				.select()
				.from(userTable)
				.where(eq(userTable.id, MOCK_USER.id));
			expect(updatedUser?.image).toBe(image);
		});

		test("旧画像がR2キーの場合、CDNへ削除リクエストを送る", async () => {
			const oldImage = "users/old.webp";
			await setCurrentImage(oldImage);

			const { cdnRequests } = await patchWithCdn({
				body: { image: "users/new.webp" },
			});

			expect(cdnRequests).toHaveLength(1);
			expect(cdnRequests[0]?.method).toBe("DELETE");
			expect(cdnRequests[0]?.url).toBe(`https://cdn/images/${oldImage}`);
		});

		test("旧画像が外部URLの場合、CDNへ削除リクエストを送らない", async () => {
			await setCurrentImage("https://example.com/avatar.png");

			const { cdnRequests } = await patchWithCdn({
				body: { image: "users/new.webp" },
			});

			expect(cdnRequests).toHaveLength(0);
		});

		test("画像が変わらない場合、CDNへ削除リクエストを送らない", async () => {
			const image = "users/same.webp";
			await setCurrentImage(image);

			const { cdnRequests } = await patchWithCdn({ body: { image } });

			expect(cdnRequests).toHaveLength(0);
		});

		test("更新する項目が無い場合、400を返す", async () => {
			const response = await mockHonoClient.v1.me.$patch({ json: {} });

			expect(response.status).toBe(400);
		});

		test("名前が空文字の場合、400を返す", async () => {
			const response = await mockHonoClient.v1.me.$patch({
				json: { name: "  " },
			});

			expect(response.status).toBe(400);
		});
	});
});
