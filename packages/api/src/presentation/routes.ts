import { Hono } from "hono";
import { logger } from "hono/logger";
import {
	hybridAuthMiddleware,
	privateAuthMiddleware,
	registrationAuthMiddleware,
} from "../middleware/auth";
import type { BaseContext } from "../types";
import { routes as gameRoutes } from "./game/gameRoutes";
import { routes as matchingRoutes } from "./matching/matchingRoutes";
import {
	registrationRoutes as meRegistrationRoutes,
	routes as meRoutes,
} from "./me/meRoutes";
import { routes as roomRoutes } from "./room/roomRoutes";
import { routes as userRoutes } from "./user/userRoutes";

export const routes = new Hono<BaseContext>()
	.use(logger())
	// 認証なし
	.route("/v1/games", gameRoutes)
	.route("/v1/matchings", matchingRoutes)
	.route("/v1/users", userRoutes)
	// 認証任意
	.use("/v1/rooms/*", hybridAuthMiddleware())
	.route("/v1/rooms", roomRoutes)
	// 登録処理用。users をこれから作るため auth.me を前提にできない
	.on("POST", "/v1/me/*", registrationAuthMiddleware())
	.route("/v1/me", meRegistrationRoutes)
	// 認証必須（有効な登録済みユーザーのみ）
	.on(["GET", "PATCH"], "/v1/me/*", privateAuthMiddleware())
	.route("/v1/me", meRoutes);
