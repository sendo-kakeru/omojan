import { CognitoService } from "@repo/shared/libs/cognito";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { Env } from "./env";

/**
 * 認証ミドルウェア
 * Cognito アクセストークンを検証し、認証されたユーザーのみアクセスを許可する。
 */
export function authMiddleware(): MiddlewareHandler<{
	Bindings: Env & { R2: R2Bucket };
	Variables: { sub: string };
}> {
	return async (c, next) => {
		try {
			const cognito = new CognitoService({
				clientId: c.env.COGNITO_CLIENT_ID,
				userPoolId: c.env.COGNITO_USER_POOL_ID,
			});
			const token = cognito.extractToken({
				authorizationHeader: c.req.header("Authorization"),
			});

			if (!token) {
				throw new HTTPException(401, {
					message: "Authorization headerが存在しません",
				});
			}

			const tokenPayload = await cognito.verifyAccessToken({ token });
			c.set("sub", tokenPayload.sub);

			await next();
		} catch (error) {
			console.error("Tokenの検証に失敗しました:", error);
			if (error instanceof HTTPException) {
				throw error;
			}
			throw new HTTPException(401, {
				message: "無効または期限切れのトークンです",
			});
		}
	};
}
