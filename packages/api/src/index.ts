import { honoErrorHandler } from "@repo/shared/libs/honoErrorHandler";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { CleanupService } from "./application/cleanup/CleanupService";
import type { Env } from "./env";
import { createDrizzleClient } from "./libs/drizzle";
import { routes } from "./presentation/routes";
import type { BaseContext } from "./types";

export { GameDurableObject } from "./application/game/GameDurableObject";
export { MatchingDurableObject } from "./application/matching/MatchingDurableObject";

export const app = new Hono<BaseContext>()
	.use((c, next) => {
		c.set("db", createDrizzleClient(c.env));
		const corsMiddleware = cors({
			allowHeaders: ["Content-Type", "Authorization", "X-Game-Token"],
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
	.onError(honoErrorHandler)
	// ヘルスチェック用
	.get("/", (c) => c.json({ message: "OK" }, 200))
	.route("", routes);

export type Api = typeof routes;

export default {
	fetch: app.fetch,
	async scheduled(
		_controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		const db = createDrizzleClient(env);
		const cleanupService = new CleanupService(db);

		ctx.waitUntil(
			cleanupService.runAll().then((result) => {
				console.log("Cleanup completed:", result);
			}),
		);
	},
};
