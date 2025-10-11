import { Hono } from "hono";
import { logger } from "hono/logger";
import {
	hybridAuthMiddleware,
	privateAuthMiddleware,
} from "../middleware/auth";
import { wsMiddleware } from "../middleware/ws";
import type {
	BaseContext,
	HttpRespondReturn,
	HybridRouteContext,
	PrivateRouteContext,
} from "../types";
import { routes as gameRoutes } from "./game/gameRoutes";
import { routes as meRoutes } from "./me/meRoutes";

// HTTP
const publicRoutes = new Hono<BaseContext>();

const hybridRoutes = new Hono<HybridRouteContext>()
	.use(hybridAuthMiddleware())
	.route("/game", gameRoutes);

const privateRoutes = new Hono<PrivateRouteContext>()
	.use(privateAuthMiddleware())
	.get("/private", (c): HttpRespondReturn => {
		return c.json({ data: null, message: "This is a private route" });
	})
	.route("/me", meRoutes);

// WebSocket
const wsHybridRoutes = new Hono<HybridRouteContext>().use(
	hybridAuthMiddleware(),
);

const wsPrivateRoutes = new Hono<PrivateRouteContext>().use(
	privateAuthMiddleware(),
);

const wsRoutes = new Hono<BaseContext>()
	.use(wsMiddleware())
	.route("", wsHybridRoutes)
	.route("", wsPrivateRoutes);

// Aggregate
export const routes = new Hono<BaseContext>()
	.use(logger())
	// ヘルスチェック（ロードバランサー・監視用）
	.get("/", (c): HttpRespondReturn => {
		return c.json({ data: null, message: "ok" });
	})
	.route("", publicRoutes)
	.route("", hybridRoutes)
	.route("/ws", wsRoutes)
	.route("", privateRoutes);
