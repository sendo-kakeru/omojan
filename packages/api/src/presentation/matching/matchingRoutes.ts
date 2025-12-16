import { verifyGameTokenRequestQuerySchema } from "@repo/db/model";
import { roomIdRequestParamSchema } from "@repo/db/schema";
import { Hono } from "hono";
import { vValidator } from "../../libs/vValidator";
import type { BaseContext } from "../../types";

export const routes = new Hono<BaseContext>().get(
	"/:roomId",
	vValidator("query", verifyGameTokenRequestQuerySchema),
	vValidator("param", roomIdRequestParamSchema),
	async (c) => {
		const { roomId } = c.req.valid("param");
		const { token } = c.req.valid("query");

		const id = c.env.MATCHING_DURABLE_OBJECT.idFromName(roomId);
		const roomStub = c.env.MATCHING_DURABLE_OBJECT.get(id);

		const durableObjectUrl = new URL(c.req.url);
		durableObjectUrl.search = "";
		durableObjectUrl.searchParams.set("token", token);
		durableObjectUrl.searchParams.set("roomId", roomId);

		return roomStub.fetch(new Request(durableObjectUrl.toString(), c.req.raw));
	},
);
