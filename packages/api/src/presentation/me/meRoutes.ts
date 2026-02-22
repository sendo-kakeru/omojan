import {
	type CreateMeResponseBody,
	createMeRequestBodySchema,
	type GetMeResponseBody,
	type UpdateMeResponseBody,
	updateMeRequestBodySchema,
} from "@repo/db/model";
import { vValidator } from "@repo/shared/libs/vValidator";
import type { HttpRespondReturn } from "@repo/shared/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { MeService } from "../../application/me/MeService";
import type { PrivateRouteContext } from "../../types";

export const routes = new Hono<
	PrivateRouteContext & { Variables: { meService: MeService } }
>()
	.use(async (c, next) => {
		const meService = new MeService(c.var.db);
		c.set("meService", meService);
		await next();
	})
	.get("/", async (c): Promise<HttpRespondReturn<GetMeResponseBody>> => {
		const { meService, sub } = c.var;

		try {
			const findMe = await meService.findBySub({ sub });

			if (findMe) {
				return c.json(
					{
						data: findMe,
						message: "OK",
					},
					200,
				);
			}

			return c.json(
				{
					data: findMe,
					message: "ユーザーが存在しません",
				},
				404,
			);
		} catch (error) {
			console.error("Meの取得に失敗しました:", error);
			if (error instanceof HTTPException) throw error;

			throw new HTTPException(500, { message: "Meの取得に失敗しました" });
		}
	})
	.post(
		"/",
		vValidator("json", createMeRequestBodySchema),
		async (c): Promise<HttpRespondReturn<CreateMeResponseBody>> => {
			const body = c.req.valid("json");
			const { meService, sub } = c.var;

			try {
				const createdMe = await meService.register({
					...body,
					sub,
				});
				return c.json({ data: createdMe, message: "Created" }, 201);
			} catch (error) {
				console.error("Meの作成に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "Meの作成に失敗しました",
				});
			}
		},
	)
	.patch(
		"/",
		vValidator("json", updateMeRequestBodySchema),
		async (c): Promise<HttpRespondReturn<UpdateMeResponseBody>> => {
			const body = c.req.valid("json");
			const { meService, sub } = c.var;

			try {
				const updatedMe = await meService.update({
					...body,
					sub,
				});
				return c.json({ data: updatedMe, message: "OK" }, 200);
			} catch (error) {
				console.error("Meの更新に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "Meの更新に失敗しました",
				});
			}
		},
	);
