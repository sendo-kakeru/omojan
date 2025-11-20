import { vValidator } from "@hono/valibot-validator";
import { verifyRoomTokenRequestQuerySchema } from "@repo/db/model";
import { gameIdRequestParamSchema } from "@repo/db/schema";
import { Hono } from "hono";
import { routeValidateCallback } from "../../libs/validation";
import type { BaseContext } from "../../types";

export const routes = new Hono<BaseContext>().get(
	"/:gameId",
	vValidator("query", verifyRoomTokenRequestQuerySchema, routeValidateCallback),
	vValidator("param", gameIdRequestParamSchema, routeValidateCallback),
	async (c) => {
		const { gameId } = c.req.valid("param");
		const { token } = c.req.valid("query");

		const id = c.env.MATCHING_DURABLE_OBJECT.idFromName(gameId);
		const roomStub = c.env.MATCHING_DURABLE_OBJECT.get(id);

		const durableObjectUrl = new URL(c.req.url);
		durableObjectUrl.search = "";
		durableObjectUrl.searchParams.set("token", token);
		durableObjectUrl.searchParams.set("gameId", gameId);

		return roomStub.fetch(new Request(durableObjectUrl.toString(), c.req.raw));
	},
);
