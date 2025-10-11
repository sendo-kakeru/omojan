import { vValidator } from "@hono/valibot-validator";
import {
	createRoomRequestBodySchema,
	type Room,
} from "@repo/shared/model/room";
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
	.post(
		"/",
		vValidator("json", createRoomRequestBodySchema, routeValidateCallback),
		async (c): Promise<HttpRespondReturn<Pick<Room, "gameId">>> => {
			const { roomService, sub } = c.var;
			const body = c.req.valid("json");

			try {
				const createdRoom = await roomService.create({
					...body,
					sub,
				});
				return c.json(
					{
						data: createdRoom,
						message: "OK",
					},
					201,
				);
			} catch (error) {
				console.error("Gameの作成に失敗しました:", error);
				throw new HTTPException(500, { message: "Roomの作成に失敗しました" });
			}
		},
	);
