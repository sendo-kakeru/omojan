import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./env";
import { imageRoutes } from "./routes";

const app = new Hono<{ Bindings: Env & { R2: R2Bucket } }>()
	.use((c, next) => {
		const corsMiddleware = cors({
			allowHeaders: ["Authorization", "Content-Type"],
			allowMethods: ["GET", "PUT", "DELETE", "HEAD", "OPTIONS"],
			exposeHeaders: ["X-Cache"],
			origin: c.env.WEB_URL,
		});
		return corsMiddleware(c, next);
	})
	.onError(honoErrorHandler)
	.route("/images", imageRoutes)
	.get("/health", (c) => c.text("ok"));

export type CdnApi = typeof app;

export default app;
