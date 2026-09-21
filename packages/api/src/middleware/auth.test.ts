import { faker } from "@faker-js/faker";
import type { Me } from "@repo/db/models";
import { userTable } from "@repo/db/schemas";
import { MOCK_USER } from "@repo/mock/model";
import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createTestDbClient } from "../__tests__/createTestDbClient";
import type {
	HybridRouteContext,
	PrivateRouteContext,
	RegistrationRouteContext,
} from "../types";
import {
	hybridAuthMiddleware,
	privateAuthMiddleware,
	registrationAuthMiddleware,
} from "./auth";

const INVALID_TOKEN = "invalid-token";

/**
 * Cognito は外部の IdP で、テストからは署名済みトークンを用意できないため
 * ここだけ差し替える。トークン文字列をそのまま sub として扱う。
 */
vi.mock("@repo/shared/libs/cognito", () => ({
	CognitoService: class {
		extractToken({
			authorizationHeader,
		}: {
			authorizationHeader?: string;
		}): string | undefined {
			if (!authorizationHeader?.startsWith("Bearer ")) return;
			return authorizationHeader.slice("Bearer ".length).trim();
		}

		async verifyAccessToken({ token }: { token: string }): Promise<{
			sub: string;
		}> {
			if (token === INVALID_TOKEN) {
				throw new Error("トークンが不正です");
			}
			return { sub: token };
		}
	},
}));

const MOCK_ENV = {
	COGNITO_CLIENT_ID: "test-client-id",
	COGNITO_USER_POOL_ID: "test-user-pool-id",
};

const authorized = (sub: string) => ({
	headers: { Authorization: `Bearer ${sub}` },
});

/** ハンドラが返した auth を取り出す */
const readAuth = async (response: Response) =>
	(await response.json<{ data: { me: Me; sub: string } | null }>()).data;

describe("認証ミドルウェア", () => {
	const db = createTestDbClient();

	beforeEach(async () => {
		await db.delete(userTable);
	});

	describe("hybridAuthMiddleware", () => {
		const app = new Hono<HybridRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				await next();
			})
			.use("*", hybridAuthMiddleware())
			.get("/", (c) => c.json({ data: c.var.auth, message: "OK" }, 200))
			.onError(honoErrorHandler);

		test("トークンが無い場合、authはnullになる", async () => {
			const response = await app.request("/", undefined, MOCK_ENV);

			expect(response.status).toBe(200);
			expect(await readAuth(response)).toBeNull();
		});

		test("トークンが不正な場合、authはnullになる", async () => {
			const response = await app.request(
				"/",
				authorized(INVALID_TOKEN),
				MOCK_ENV,
			);

			expect(response.status).toBe(200);
			expect(await readAuth(response)).toBeNull();
		});

		test("未登録の場合、authはnullになる", async () => {
			const response = await app.request(
				"/",
				authorized(faker.string.uuid()),
				MOCK_ENV,
			);

			expect(response.status).toBe(200);
			expect(await readAuth(response)).toBeNull();
		});

		test("無効化されている場合、authはnullになる", async () => {
			await db
				.insert(userTable)
				.values({ ...MOCK_USER, status: "deactivated" });

			const response = await app.request(
				"/",
				authorized(MOCK_USER.sub),
				MOCK_ENV,
			);

			expect(response.status).toBe(200);
			expect(await readAuth(response)).toBeNull();
		});

		test("有効な登録済みユーザーの場合、authにmeが入る", async () => {
			await db.insert(userTable).values(MOCK_USER);

			const response = await app.request(
				"/",
				authorized(MOCK_USER.sub),
				MOCK_ENV,
			);

			expect(response.status).toBe(200);
			const auth = await readAuth(response);
			expect(auth?.sub).toBe(MOCK_USER.sub);
			expect(auth?.me.email).toBe(MOCK_USER.email);
			expect(auth?.me.userId).toBe(MOCK_USER.id);
		});
	});

	describe("privateAuthMiddleware", () => {
		const app = new Hono<PrivateRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				await next();
			})
			.use("*", privateAuthMiddleware())
			.get("/", (c) => c.json({ data: c.var.auth, message: "OK" }, 200))
			.onError(honoErrorHandler);

		test("トークンが無い場合、401を返す", async () => {
			const response = await app.request("/", undefined, MOCK_ENV);

			expect(response.status).toBe(401);
		});

		test("トークンが不正な場合、401を返す", async () => {
			const response = await app.request(
				"/",
				authorized(INVALID_TOKEN),
				MOCK_ENV,
			);

			expect(response.status).toBe(401);
		});

		test("未登録の場合、404を返す", async () => {
			const response = await app.request(
				"/",
				authorized(faker.string.uuid()),
				MOCK_ENV,
			);

			expect(response.status).toBe(404);
		});

		test("無効化されている場合、403を返す", async () => {
			await db
				.insert(userTable)
				.values({ ...MOCK_USER, status: "deactivated" });

			const response = await app.request(
				"/",
				authorized(MOCK_USER.sub),
				MOCK_ENV,
			);

			expect(response.status).toBe(403);
		});

		test("有効な登録済みユーザーの場合、authにmeが入る", async () => {
			await db.insert(userTable).values(MOCK_USER);

			const response = await app.request(
				"/",
				authorized(MOCK_USER.sub),
				MOCK_ENV,
			);

			expect(response.status).toBe(200);
			const auth = await readAuth(response);
			expect(auth?.sub).toBe(MOCK_USER.sub);
			expect(auth?.me.userId).toBe(MOCK_USER.id);
		});
	});

	describe("registrationAuthMiddleware", () => {
		const app = new Hono<RegistrationRouteContext>()
			.use("*", async (c, next) => {
				c.set("db", db);
				await next();
			})
			.use("*", registrationAuthMiddleware())
			.get("/", (c) => c.json({ data: c.var.auth, message: "OK" }, 200))
			.onError(honoErrorHandler);

		test("トークンが無い場合、401を返す", async () => {
			const response = await app.request("/", undefined, MOCK_ENV);

			expect(response.status).toBe(401);
		});

		test("未登録でもsubが渡る", async () => {
			const sub = faker.string.uuid();

			const response = await app.request("/", authorized(sub), MOCK_ENV);

			expect(response.status).toBe(200);
			expect((await readAuth(response))?.sub).toBe(sub);
		});
	});
});
