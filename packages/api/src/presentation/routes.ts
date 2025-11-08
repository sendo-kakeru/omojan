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
import { routes as meRoutes } from "./me/meRoutes";
import { routes as roomRoutes } from "./room/roomRoutes";

// HTTP
const publicRoutes = new Hono<BaseContext>();

const hybridRoutes = new Hono<HybridRouteContext>()
	.use(hybridAuthMiddleware())
	.route("/v1/rooms", roomRoutes);

const privateRoutes = new Hono<PrivateRouteContext>()
	.use(privateAuthMiddleware())
	.get("/private", (c): HttpRespondReturn => {
		return c.json({ data: null, message: "This is a private route" });
	})
	.route("/v1/me", meRoutes);

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
	.route("", publicRoutes)
	.route("", hybridRoutes)
	.route("/v1/ws", wsRoutes)
	.route("", privateRoutes);
