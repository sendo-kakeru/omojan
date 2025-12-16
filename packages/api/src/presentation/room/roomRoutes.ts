import {
	type CreateGameResponseBody,
	createGameRequestBodySchema,
	type GetGameListResponseBody,
	type GetGameResponseBody,
	gameTokenHeaderSchema,
	type JoinGameResponseBody,
	joinGameRequestBodySchema,
} from "@repo/db/model";
import { roomIdRequestParamSchema } from "@repo/db/schema";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { RoomService } from "../../application/room/RoomService";
import { vValidator } from "../../libs/vValidator";
import type { HttpRespondReturn, HybridRouteContext } from "../../types";

export const routes = new Hono<
	HybridRouteContext & { Variables: { roomService: RoomService } }
>()
	.use(async (c, next) => {
		const roomService = new RoomService(c.var.db);
		c.set("roomService", roomService);
		await next();
	})
	.get("/", async (c): Promise<HttpRespondReturn<GetGameListResponseBody>> => {
		const { roomService } = c.var;

		try {
			const rooms = await roomService.findMany();
			return c.json(
				{
					data: rooms,
					message: "OK",
				},
				200,
			);
		} catch (error) {
			console.error("Roomの取得に失敗しました:", error);
			if (error instanceof HTTPException) throw error;

			throw new HTTPException(500, { message: "Roomの取得に失敗しました" });
		}
	})
	.post(
		"/",
		vValidator("json", createGameRequestBodySchema),
		async (c): Promise<HttpRespondReturn<CreateGameResponseBody>> => {
			const { roomService, sub } = c.var;
			const body = c.req.valid("json");

			try {
				const result = await roomService.create({
					...body,
					sub,
				});
				return c.json(
					{
						data: result,
						message: "OK",
					},
					201,
				);
			} catch (error) {
				console.error("Roomの作成に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, { message: "Roomの作成に失敗しました" });
			}
		},
	)
	.get(
		"/:roomId",
		vValidator("param", roomIdRequestParamSchema),
		vValidator("header", gameTokenHeaderSchema),
		async (c): Promise<HttpRespondReturn<GetGameResponseBody>> => {
			const { roomService } = c.var;
			const { roomId } = c.req.valid("param");
			const { "x-game-token": gameToken } = c.req.valid("header");

			try {
				const room = await roomService.findByRoomId({
					gameToken,
					roomId,
				});

				return c.json(
					{
						data: room,
						message: "OK",
					},
					200,
				);
			} catch (error) {
				console.error("Roomの取得に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, { message: "Roomの取得に失敗しました" });
			}
		},
	)
	.post(
		"/:roomId/join",
		vValidator("json", joinGameRequestBodySchema),
		vValidator("param", roomIdRequestParamSchema),
		async (c): Promise<HttpRespondReturn<JoinGameResponseBody>> => {
			const { roomService, sub } = c.var;
			const body = c.req.valid("json");
			const { roomId } = c.req.valid("param");

			try {
				const playerToken = await roomService.join({
					...body,
					roomId,
					sub,
				});

				return c.json(
					{
						data: playerToken,
						message: "OK",
					},
					201,
				);
			} catch (error) {
				if (error instanceof HTTPException) throw error;

				console.error("Roomへの参加に失敗しました:", error);
				throw new HTTPException(500, {
					message: "Roomへの参加に失敗しました",
				});
			}
		},
	);
