import { Hono } from "hono";
import { logger } from "hono/logger";
import {
	hybridAuthMiddleware,
	privateAuthMiddleware,
} from "../middleware/auth";
import type {
	BaseContext,
	HybridRouteContext,
	PrivateRouteContext,
} from "../types";
import { routes as matchingRoutes } from "./matching/matchingRoutes";
import { routes as meRoutes } from "./me/meRoutes";
import { routes as roomRoutes } from "./room/roomRoutes";

const publicRoutes = new Hono<BaseContext>().route(
	"/v1/matchings",
	matchingRoutes,
);

const hybridRoutes = new Hono<HybridRouteContext>()
	.use(hybridAuthMiddleware())
	.route("/v1/rooms", roomRoutes);

const privateRoutes = new Hono<PrivateRouteContext>()
	.use(privateAuthMiddleware())
	.route("/v1/me", meRoutes);

// Aggregate
export const routes = new Hono()
	.use(logger())
	.route("", publicRoutes)
	.route("", hybridRoutes)
	.route("", privateRoutes);
