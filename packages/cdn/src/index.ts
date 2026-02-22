import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { imageRoutes } from "./images";

const app = new Hono<{ Bindings: CloudflareBindings }>()
	.use((c, next) => {
		const corsMiddleware = cors({
			allowHeaders: ["Content-Type"],
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
