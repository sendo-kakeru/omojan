import { verifyRoomTokenRequestQuerySchema } from "@repo/db/model";
import { gameIdRequestParamSchema } from "@repo/db/schema";
import { Hono } from "hono";
import { vValidator } from "../../libs/vValidator";
import type { BaseContext } from "../../types";

export const routes = new Hono<BaseContext>().get(
	"/:gameId",
	vValidator("query", verifyRoomTokenRequestQuerySchema),
	vValidator("param", gameIdRequestParamSchema),
	async (c) => {
		const { gameId } = c.req.valid("param");
		const { token } = c.req.valid("query");

		const id = c.env.GAME_DURABLE_OBJECT.idFromName(gameId);
		const gameStub = c.env.GAME_DURABLE_OBJECT.get(id);

		const durableObjectUrl = new URL(c.req.url);
		durableObjectUrl.search = "";
		durableObjectUrl.searchParams.set("token", token);
		durableObjectUrl.searchParams.set("gameId", gameId);

		return gameStub.fetch(new Request(durableObjectUrl.toString(), c.req.raw));
	},
);
