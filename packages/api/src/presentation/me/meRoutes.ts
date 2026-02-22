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

const R2_KEY_PATTERN = /^[a-zA-Z0-9\-_/.]+$/;

/**
 * R2キーとして安全な値かどうかを判定する。
 * CDN 側 validateKey（packages/cdn/src/key.ts）と同等のチェック。
 * 外部 URL（https://...）は正規表現で弾かれるため別途判定不要。
 */
function isSafeR2Key(key: string): boolean {
	if (!key || key.length > 1024) return false;
	if (key.startsWith("/")) return false;
	if (key.includes("..") || key.includes("//")) return false;
	if (key.includes("/./") || key.endsWith("/.") || key === ".") return false;
	return R2_KEY_PATTERN.test(key);
}

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
				// 画像更新時は UPDATE 前に旧画像キーを取得する
				let oldImageKey: string | null = null;
				if (body.image) {
					oldImageKey = await meService.getImageKey({ sub });
				}

				const updatedMe = await meService.update({
					...body,
					sub,
				});

				// 旧画像が R2 キー（外部 URL でない）かつ新旧が異なる場合、CDN から削除
				if (
					oldImageKey &&
					isSafeR2Key(oldImageKey) &&
					oldImageKey !== body.image
				) {
					c.executionCtx.waitUntil(
						c.env.CDN_WORKER.fetch(
							new Request(`https://cdn/images/${oldImageKey}`, {
								headers: {
									Authorization: c.req.header("Authorization") ?? "",
								},
								method: "DELETE",
							}),
						)
							.then(async (res) => {
								await res.body?.cancel();
								if (!res.ok) {
									console.error(
										"旧画像の削除が失敗レスポンスを返しました:",
										res.status,
									);
								}
							})
							.catch((error) => {
								console.error("旧画像の削除に失敗しました:", error);
							}),
					);
				}

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
