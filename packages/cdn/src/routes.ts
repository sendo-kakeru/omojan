import { MAX_IMAGE_FILE_SIZE } from "@repo/shared/constants/image";
import { vValidator } from "@repo/shared/libs/vValidator";
import type { HttpRespondReturn } from "@repo/shared/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { authMiddleware } from "./auth";
import { getCached, normalizeCacheKey, purgeCached, setCached } from "./cache";
import type { Env } from "./env";
import { validateKey } from "./key";
import { detectMime } from "./mime";
import { proxyToOrigin } from "./originProxy";
import { imageDeliveryQuerySchema } from "./schemas";

type BaseContext = { Bindings: Env & { R2: R2Bucket } };
type PrivateContext = BaseContext & { Variables: { sub: string } };

const publicRoutes = new Hono<BaseContext>().get(
	"/*",
	vValidator("query", imageDeliveryQuerySchema),
	async (c): Promise<Response> => {
		const key = c.req.path.replace(/^\/images\//, "");
		validateKey(key);

		const query = c.req.valid("query");
		const cacheKey = normalizeCacheKey(new URL(c.req.url));

		const cached = await getCached(cacheKey);
		if (cached) {
			const response = new Response(cached.body, cached);
			response.headers.set("X-Cache", "HIT");
			return response;
		}

		const originResponse = await proxyToOrigin({
			gcpServiceAccountKey: c.env.GCP_SERVICE_ACCOUNT_KEY,
			key,
			originUrl: c.env.ORIGIN_URL,
			query,
		});

		const response = new Response(originResponse.body, originResponse);
		response.headers.set("X-Cache", "MISS");

		c.executionCtx.waitUntil(
			setCached({ cacheKey, response: response.clone() }),
		);

		return response;
	},
);

const privateRoutes = new Hono<PrivateContext>()
	.use(authMiddleware())
	.put("/*", async (c): Promise<HttpRespondReturn<{ key: string }>> => {
		const key = c.req.path.replace(/^\/images\//, "");
		validateKey(key);

		const contentLength = Number(c.req.header("content-length") ?? 0);
		if (contentLength > MAX_IMAGE_FILE_SIZE) {
			throw new HTTPException(413, {
				message: `ファイルサイズが上限を超えています (最大${MAX_IMAGE_FILE_SIZE}バイト)`,
			});
		}

		const body = await c.req.arrayBuffer();

		if (body.byteLength === 0) {
			throw new HTTPException(400, {
				message: "リクエストボディが空です",
			});
		}
		if (body.byteLength > MAX_IMAGE_FILE_SIZE) {
			throw new HTTPException(413, {
				message: `ファイルサイズが上限を超えています (最大${MAX_IMAGE_FILE_SIZE}バイト)`,
			});
		}

		const contentType = detectMime(body);
		if (!contentType) {
			throw new HTTPException(400, {
				message: "対応していない画像フォーマットです",
			});
		}

		await c.env.R2.put(key, body, {
			httpMetadata: { contentType },
		});

		return c.json({ data: { key }, message: "Created" }, 201);
	})
	.delete("/*", async (c): Promise<HttpRespondReturn> => {
		const key = c.req.path.replace(/^\/images\//, "");
		validateKey(key);

		await c.env.R2.delete(key);

		c.executionCtx.waitUntil(purgeCached(new URL(c.req.url)));

		return c.json({ data: null, message: "Deleted" }, 200);
	});

export const imageRoutes = new Hono<BaseContext>()
	.route("", publicRoutes)
	.route("", privateRoutes);
