import { verifyRoomTokenRequestQuerySchema } from "@repo/db/models";
import { gameIdRequestParamSchema } from "@repo/db/schemas";
import { vValidator } from "@repo/shared/libs/vValidator";
import { Hono } from "hono";
import type { BaseContext } from "../../types";

export const routes = new Hono<BaseContext>().get(
	"/:gameId",
	vValidator("query", verifyRoomTokenRequestQuerySchema),
	vValidator("param", gameIdRequestParamSchema),
	async (c) => {
		const { gameId } = c.req.valid("param");
		const { connectSeq, token } = c.req.valid("query");

		const id = c.env.MATCHING_DURABLE_OBJECT.idFromName(gameId);
		const roomStub = c.env.MATCHING_DURABLE_OBJECT.get(id);

		const durableObjectUrl = new URL(c.req.url);
		durableObjectUrl.search = "";
		durableObjectUrl.searchParams.set("token", token);
		durableObjectUrl.searchParams.set("gameId", gameId);
		durableObjectUrl.searchParams.set("connectSeq", String(connectSeq));

		return roomStub.fetch(new Request(durableObjectUrl.toString(), c.req.raw));
	},
);
