import {
	type GameResultResponseBody,
	gameResultRequestParamSchema,
	verifyRoomTokenRequestQuerySchema,
} from "@repo/db/models";
import { gameIdRequestParamSchema } from "@repo/db/schemas";
import { vValidator } from "@repo/shared/libs/vValidator";
import type { HttpRespondReturn } from "@repo/shared/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { GameService } from "../../application/game/GameService";
import type { BaseContext } from "../../types";

export const routes = new Hono<
	BaseContext & { Variables: { gameService: GameService } }
>()
	.use(async (c, next) => {
		const gameService = new GameService(c.var.db);
		c.set("gameService", gameService);
		await next();
	})
	.get(
		"/:gameId",
		vValidator("query", verifyRoomTokenRequestQuerySchema),
		vValidator("param", gameIdRequestParamSchema),
		async (c) => {
			const { gameId } = c.req.valid("param");
			const { connectSeq, token } = c.req.valid("query");

			const id = c.env.GAME_DURABLE_OBJECT.idFromName(gameId);
			const gameStub = c.env.GAME_DURABLE_OBJECT.get(id);

			const durableObjectUrl = new URL(c.req.url);
			durableObjectUrl.search = "";
			durableObjectUrl.searchParams.set("token", token);
			durableObjectUrl.searchParams.set("gameId", gameId);
			durableObjectUrl.searchParams.set("connectSeq", String(connectSeq));

			return gameStub.fetch(
				new Request(durableObjectUrl.toString(), c.req.raw),
			);
		},
	)
	.get(
		"/:gameId/result",
		vValidator("param", gameResultRequestParamSchema),
		async (c): Promise<HttpRespondReturn<GameResultResponseBody>> => {
			const { gameService } = c.var;
			const { gameId } = c.req.valid("param");

			try {
				const result = await gameService.getResult({ gameId });

				return c.json(
					{
						data: result,
						message: "OK",
					},
					200,
				);
			} catch (error) {
				console.error("ゲーム結果の取得に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "ゲーム結果の取得に失敗しました",
				});
			}
		},
	);
