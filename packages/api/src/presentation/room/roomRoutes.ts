import { vValidator } from "@hono/valibot-validator";
import {
	type CreateRoomResponseBody,
	createRoomRequestBodySchema,
	type GetRoomListResponseBody,
	type JoinRoomResponseBody,
	joinRoomRequestBodySchema,
} from "@repo/db/model";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { RoomService } from "../../application/room/RoomService";
import { routeValidateCallback } from "../../libs/validation";
import type { HttpRespondReturn, HybridRouteContext } from "../../types";

export const routes = new Hono<
	HybridRouteContext & { Variables: { roomService: RoomService } }
>()
	.use(async (c, next) => {
		const roomService = new RoomService(c.var.db);
		c.set("roomService", roomService);
		await next();
	})
	.get("/", async (c): Promise<HttpRespondReturn<GetRoomListResponseBody>> => {
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
		vValidator("json", createRoomRequestBodySchema, routeValidateCallback),
		async (c): Promise<HttpRespondReturn<CreateRoomResponseBody>> => {
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
	.post(
		"/:gameId/join",
		vValidator("json", joinRoomRequestBodySchema, routeValidateCallback),
		async (c): Promise<HttpRespondReturn<JoinRoomResponseBody>> => {
			const { roomService, sub } = c.var;
			const body = c.req.valid("json");
			const { gameId } = c.req.param();

			try {
				const playerToken = await roomService.join({
					...body,
					gameId,
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
