import { vValidator } from "@hono/valibot-validator";
import {
	type CreateRoomResponseBody,
	createRoomRequestBodySchema,
	type GetRoomListResponseBody,
	type JoinRoomResponseBody,
	joinRoomRequestBodySchema,
} from "@repo/shared/model/room";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createRoomApplicationService } from "../../application/room";
import type { RoomApplicationService } from "../../application/room/RoomApplicationService";
import {
	RoomClosedError,
	RoomIsFullError,
	RoomNotFoundError,
	RoomPasswordMismatchError,
	RoomPasswordRequiredError,
} from "../../domain/room/errors";
import { DrizzleRoomRepository } from "../../infrastructure/repository/DrizzleRoomRepository";
import { DrizzleUserRepository } from "../../infrastructure/repository/DrizzleUserRepository";
import { CryptoRoomTokenService } from "../../infrastructure/security/CryptoRoomTokenService";
import { RandomRoomPasswordService } from "../../infrastructure/security/RandomRoomPasswordService";
import { routeValidateCallback } from "../../libs/validation";
import type { HttpRespondReturn, HybridRouteContext } from "../../types";

export const routes = new Hono<
	HybridRouteContext & { Variables: { roomService: RoomApplicationService } }
>()
	.use(async (c, next) => {
		const roomService = createRoomApplicationService({
			roomPasswordService: new RandomRoomPasswordService(),
			roomRepository: new DrizzleRoomRepository(c.var.db),
			roomTokenService: new CryptoRoomTokenService(),
			userRepository: new DrizzleUserRepository(c.var.db),
		});
		c.set("roomService", roomService);
		await next();
	})
	.get("/", async (c): Promise<HttpRespondReturn<GetRoomListResponseBody>> => {
		const { roomService } = c.var;

		try {
			const rooms = await roomService.listWaitingRooms();
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
				const result = await roomService.createRoom({
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
				const playerToken = await roomService.joinRoom({
					...body,
					gameId,
					heldToken: body.heldToken,
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

				const mappedError = mapJoinRoomErrorToHttpException(error);
				if (mappedError) throw mappedError;

				console.error("Roomへの参加に失敗しました:", error);
				throw new HTTPException(500, {
					message: "Roomへの参加に失敗しました",
				});
			}
		},
	);

function mapJoinRoomErrorToHttpException(error: unknown): HTTPException | null {
	if (error instanceof RoomNotFoundError) {
		return new HTTPException(404, { message: error.message });
	}
	if (error instanceof RoomClosedError) {
		return new HTTPException(400, { message: error.message });
	}
	if (error instanceof RoomPasswordRequiredError) {
		return new HTTPException(400, { message: error.message });
	}
	if (error instanceof RoomPasswordMismatchError) {
		return new HTTPException(403, { message: error.message });
	}
	if (error instanceof RoomIsFullError) {
		return new HTTPException(409, { message: error.message });
	}
	return null;
}
