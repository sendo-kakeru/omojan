import { CognitoService } from "@repo/shared/libs/cognito";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { PrivateContext } from "./types";

/**
 * CognitoService のインスタンスキャッシュ。
 * リクエストごとの再生成を避け、内部の JWKS キャッシュを
 * 同一 isolate 内で再利用する。
 */
let cognitoService: CognitoService | null = null;

/**
 * 認証ミドルウェア
 * Cognito アクセストークンを検証し、認証されたユーザーのみアクセスを許可する。
 */
export function authMiddleware(): MiddlewareHandler<PrivateContext> {
	return async (c, next) => {
		try {
			cognitoService ??= new CognitoService({
				clientId: c.env.COGNITO_CLIENT_ID,
				userPoolId: c.env.COGNITO_USER_POOL_ID,
			});
			const token = cognitoService.extractToken({
				authorizationHeader: c.req.header("Authorization"),
			});

			if (!token) {
				throw new HTTPException(401, {
					message: "Authorization headerが存在しません",
				});
			}

			const tokenPayload = await cognitoService.verifyAccessToken({
				token,
			});
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
