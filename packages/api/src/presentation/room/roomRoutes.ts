import {
	type CreateRoomResponseBody,
	createRoomRequestBodySchema,
	type GetRoomCountResponseBody,
	type GetRoomListFinishedResponseBody,
	type GetRoomListWaitingResponseBody,
	type GetRoomResponseBody,
	gameTokenHeaderSchema,
	getRoomCountRequestQuerySchema,
	getRoomListRequestQuerySchema,
	type JoinRoomResponseBody,
	joinRoomRequestBodySchema,
} from "@repo/db/model";
import { gameIdRequestParamSchema } from "@repo/db/schema";
import { vValidator } from "@repo/shared/libs/vValidator";
import type { HttpRespondReturn } from "@repo/shared/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { RoomService } from "../../application/room/RoomService";
import type { HybridRouteContext } from "../../types";

export const routes = new Hono<
	HybridRouteContext & { Variables: { roomService: RoomService } }
>()
	.use(async (c, next) => {
		const roomService = new RoomService(c.var.db);
		c.set("roomService", roomService);
		await next();
	})
	// ページネーション付き部屋一覧
	.get(
		"/",
		vValidator("query", getRoomListRequestQuerySchema),
		async (
			c,
		): Promise<
			HttpRespondReturn<
				GetRoomListWaitingResponseBody | GetRoomListFinishedResponseBody
			>
		> => {
			const { roomService } = c.var;
			const query = c.req.valid("query");
			const status = query.status ?? "waiting";
			const page = query.page ?? 1;
			const limit = query.limit ?? 20;

			try {
				if (status === "finished") {
					const result = await roomService.findManyFinished({
						limit,
						page,
						userId: query.userId,
					});
					return c.json(
						{
							data: result,
							message: "OK",
						},
						200,
					);
				}

				const result = await roomService.findManyWaiting({
					limit,
					page,
					userId: query.userId,
				});
				return c.json(
					{
						data: result,
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
		"/",
		vValidator("json", createRoomRequestBodySchema),
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
	// 件数取得
	.get(
		"/count",
		vValidator("query", getRoomCountRequestQuerySchema),
		async (c): Promise<HttpRespondReturn<GetRoomCountResponseBody>> => {
			const { roomService } = c.var;
			const query = c.req.valid("query");
			const status = query.status ?? "active";

			try {
				const count = await roomService.countByStatus({ status });
				return c.json(
					{
						data: { count },
						message: "OK",
					},
					200,
				);
			} catch (error) {
				console.error("Room件数の取得に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "Room件数の取得に失敗しました",
				});
			}
		},
	)
	.get(
		"/:gameId",
		vValidator("param", gameIdRequestParamSchema),
		vValidator("header", gameTokenHeaderSchema),
		async (c): Promise<HttpRespondReturn<GetRoomResponseBody>> => {
			const { roomService } = c.var;
			const { gameId } = c.req.valid("param");
			const { "x-game-token": gameToken } = c.req.valid("header");

			try {
				const room = await roomService.findByGameId({ gameId, gameToken });

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
		"/:gameId/join",
		vValidator("json", joinRoomRequestBodySchema),
		vValidator("param", gameIdRequestParamSchema),
		async (c): Promise<HttpRespondReturn<JoinRoomResponseBody>> => {
			const { roomService, sub } = c.var;
			const body = c.req.valid("json");
			const { gameId } = c.req.valid("param");

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
