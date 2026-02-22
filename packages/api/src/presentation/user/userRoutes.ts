import {
	type GetPublicUserResponseBody,
	userRequestParamSchema,
} from "@repo/db/model";
import { vValidator } from "@repo/shared/libs/vValidator";
import type { HttpRespondReturn } from "@repo/shared/types";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { UserService } from "../../application/user/UserService";
import type { BaseContext } from "../../types";

export const routes = new Hono<
	BaseContext & { Variables: { userService: UserService } }
>()
	.use(async (c, next) => {
		const userService = new UserService(c.var.db);
		c.set("userService", userService);
		await next();
	})
	.get(
		"/:userId",
		vValidator("param", userRequestParamSchema),
		async (c): Promise<HttpRespondReturn<GetPublicUserResponseBody>> => {
			const { userId } = c.req.valid("param");
			const { userService } = c.var;

			try {
				const user = await userService.findById({ id: userId });

				if (!user) {
					return c.json(
						{ data: null, message: "ユーザーが見つかりません" },
						404,
					);
				}

				return c.json({ data: user, message: "OK" }, 200);
			} catch (error) {
				console.error("ユーザーの取得に失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "ユーザーの取得に失敗しました",
				});
			}
		},
	);
