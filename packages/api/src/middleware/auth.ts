import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { CognitoService } from "../application/CognitoService";
import type { HybridRouteContext, PrivateRouteContext } from "../types";

/**
 * @returns MiddlewareHandler<HybridRouteContext>
 * ハイブリッド認証ミドルウェア
 * 認証されたユーザーと未認証のユーザーの両方がアクセスでき、認証済みであればsubを設定します。
 */
export function hybridAuthMiddleware(): MiddlewareHandler<HybridRouteContext> {
	return async (c, next): Promise<void> => {
		try {
			const cognito = new CognitoService(c.env);
			const token = cognito.extractToken({
				authorizationHeader: c.req.header("Authorization"),
			});

			if (token) {
				const tokenPayload = await cognito.verifyAccessToken({ token });
				c.set("sub", tokenPayload.sub);
			} else {
				c.set("sub", null);
			}
		} catch (error) {
			console.error("Tokenの検証に失敗しました:", error);
			c.set("sub", null);
		}

		await next();
	};
}

/**
 * @returns MiddlewareHandler<PrivateRouteContext>
 * プライベート認証ミドルウェア
 * 認証されたユーザーのみがアクセスでき、subを設定します。
 */
export function privateAuthMiddleware(): MiddlewareHandler<PrivateRouteContext> {
	return async (c, next): Promise<void> => {
		try {
			const cognito = new CognitoService(c.env);
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
