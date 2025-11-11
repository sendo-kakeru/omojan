import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { getDrizzleClient } from "./libs/drizzle";
import { routes } from "./presentation/routes";
import type { BaseContext, HttpRespondReturn } from "./types";

const app = new Hono<BaseContext>()
	.use((c, next) => {
		c.set("db", getDrizzleClient({ env: c.env }));
		const corsMiddleware = cors({
			allowHeaders: ["Content-Type", "Authorization"],
			allowMethods: [
				"GET",
				"POST",
				"PATCH",
				"PUT",
				"DELETE",
				"HEAD",
				"OPTIONS",
			],
			origin: c.env.WEB_URL,
		});
		return corsMiddleware(c, next);
	})
	.onError((error, c): HttpRespondReturn => {
		console.error("Error:", error);
		if (error instanceof HTTPException) {
			return c.json({ data: null, message: error.message }, error.status);
		}
		return c.json({ data: null, message: "Internal Server Error" }, 500);
	})
	.route("", routes);

export type Api = typeof routes;

export default app;
