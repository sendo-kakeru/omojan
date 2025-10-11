import { vValidator } from "@hono/valibot-validator";
import { UniqueKeyAlreadyExistsError } from "@repo/shared/error";
import {
	type CreateMeResponseBody,
	createMeRequestBodySchema,
	type GetMeResponseBody,
} from "@repo/shared/model/me";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { MeService } from "../../application/me/MeService";
import { routeValidateCallback } from "../../libs/validation";
import type { HttpRespondReturn, PrivateRouteContext } from "../../types";

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
			throw new HTTPException(500, { message: "Meの取得に失敗しました" });
		}
	})
	.post(
		"/",
		vValidator("json", createMeRequestBodySchema, routeValidateCallback),
		async (c): Promise<HttpRespondReturn<CreateMeResponseBody>> => {
			const body = c.req.valid("json");
			const { db, sub } = c.var;

			const meService = new MeService(db);

			try {
				const createdMe = await meService.register({
					...body,
					sub,
				});
				return c.json({ data: createdMe, message: "Created" }, 201);
			} catch (error) {
				console.error("Meの作成に失敗しました:", error);
				if (error instanceof UniqueKeyAlreadyExistsError) {
					throw new HTTPException(409, {
						message: "ユーザーは既に存在します",
					});
				}
				throw new HTTPException(500, {
					message: "Meの作成に失敗しました",
				});
			}
		},
	);
