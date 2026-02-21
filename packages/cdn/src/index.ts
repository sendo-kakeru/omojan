import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
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
	.onError((error, c) => {
		if (error instanceof HTTPException) {
			return c.json({ error: error.message }, error.status);
		}
		console.error("予期しないエラー:", error);
		return c.json({ error: "Internal Server Error" }, 500);
	})
	.route("/images", imageRoutes)
	.get("/health", (c) => c.text("ok"));

export type CdnApi = typeof app;

export default app;
