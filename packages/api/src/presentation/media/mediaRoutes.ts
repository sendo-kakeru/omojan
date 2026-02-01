import type { UploadImageResponseBody } from "@repo/db/model";
import { imageFileSchema, uploadImageRequestQuerySchema } from "@repo/db/model";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { safeParse } from "valibot";
import { MeService } from "../../application/me/MeService";
import { MediaService } from "../../application/media/MediaService";
import { vValidator } from "../../libs/vValidator";
import type { HttpRespondReturn, PrivateRouteContext } from "../../types";

export const routes = new Hono<
	// ログイン済みユーザーのみアップロード可能
	PrivateRouteContext & {
		Variables: {
			mediaService: MediaService;
			meService: MeService;
		};
	}
>()
	.use(async (c, next) => {
		const mediaService = new MediaService(
			c.env.MEDIA_BUCKET,
			c.env.MEDIA_BUCKET_PUBLIC_URL,
		);
		const meService = new MeService(c.var.db);
		c.set("mediaService", mediaService);
		c.set("meService", meService);
		await next();
	})
	// 必要であれば検討
	// - 署名付きURL発行方式を
	// - height指定

	/**
	 * 複数サイズの画像をアップロード
	 * 変換成功時はwebp形式、失敗時またはローカル環境では元の形式で保存
	 * POST /v1/media/images
	 * Query: width - カンマ区切りの幅 (例: "64,128,256,512")
	 * Body: multipart/form-data の "file" フィールド
	 * 保存先: users/{userId}/images/{uuid}/{width}
	 */
	.post(
		"/images",
		vValidator("query", uploadImageRequestQuerySchema),
		async (c): Promise<HttpRespondReturn<UploadImageResponseBody>> => {
			const { mediaService, meService, sub } = c.var;
			const { width } = c.req.valid("query");

			// ユーザー情報を取得
			const user = await meService.findBySub({ sub });
			if (!user) {
				throw new HTTPException(404, {
					message: "ユーザーが見つかりません",
				});
			}

			const body = await c.req.parseBody();
			const fileResult = safeParse(imageFileSchema, body.file);

			if (!fileResult.success) {
				throw new HTTPException(400, {
					message: fileResult.issues[0]?.message ?? "無効な画像ファイルです",
				});
			}

			try {
				const uuid = crypto.randomUUID();
				const baseKey = `users/${user.userId}/images/${uuid}`;
				const results = await mediaService.uploadImage({
					baseKey,
					file: fileResult.output,
					widths: width,
				});

				return c.json(
					{
						data: results,
						message: "Created",
					},
					201,
				);
			} catch (error) {
				console.error("画像のアップロードに失敗しました:", error);
				if (error instanceof HTTPException) throw error;

				throw new HTTPException(500, {
					message: "画像のアップロードに失敗しました",
				});
			}
		},
	);
