import { vValidator } from "@hono/valibot-validator";
import { type Game, gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { createSelectSchema } from "drizzle-valibot";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import {
	type InferOutput,
	minValue,
	number,
	object,
	pick,
	pipe,
} from "valibot";
import { GameService } from "../../application/game/GameService";
import { routeValidateCallback } from "../../libs/validation";
import type { HttpRespondReturn, HybridRouteContext } from "../../types";

// create
export const createGameRequestBodySchema = object({
	...pick(createSelectSchema(gameTable), ["isPrivate", "password", "title"])
		.entries,
	timeLimit: pipe(number(), minValue(1)),
	...pick(createSelectSchema(playerTable), ["playerName"]).entries,
});
export type CreateGameRequestBody = InferOutput<
	typeof createGameRequestBodySchema
>;

export const routes = new Hono<HybridRouteContext>().post(
	"/",
	vValidator("json", createGameRequestBodySchema, routeValidateCallback),
	async (c): Promise<HttpRespondReturn<Pick<Game, "id">>> => {
		const { db, sub } = c.var;
		const body = c.req.valid("json");

		const gameService = new GameService(db);

		try {
			const createdGame = await gameService.create({
				game: body,
				player: { playerName: body.playerName },
				sub,
			});
			return c.json(
				{
					data: createdGame,
					message: "OK",
				},
				201,
			);
		} catch (error) {
			console.error("Gameの作成に失敗しました:", error);
			throw new HTTPException(500, { message: "Gameの作成に失敗しました" });
		}
	},
);
