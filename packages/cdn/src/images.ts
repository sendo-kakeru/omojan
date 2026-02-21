import { MAX_IMAGE_FILE_SIZE } from "@repo/shared/constants/image";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validateKey } from "./key";
import { detectMime } from "./mime";

export const imageRoutes = new Hono<{
	Bindings: CloudflareBindings;
}>().put("/*", async (c) => {
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

	return c.json({ key }, 201);
});
