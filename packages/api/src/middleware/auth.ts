import { userTable } from "@repo/db/schema";
import { CognitoService } from "@repo/shared/libs/cognito";
import { eq } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../libs/drizzle";
import type { HybridRouteContext, PrivateRouteContext } from "../types";

/**
 * CognitoService のインスタンスキャッシュ。
 * リクエストごとの再生成を避け、内部の JWKS キャッシュを
 * 同一 isolate 内で再利用する。
 */
let cognitoService: CognitoService | null = null;

/**
 * ユーザーが無効化されていないことを確認する。
 * ユーザーが未登録の場合（新規登録フロー）はスキップする。
 */
async function assertUserActive(db: DrizzleClient, sub: string): Promise<void> {
	const [user] = await db
		.select({ status: userTable.status })
		.from(userTable)
		.where(eq(userTable.sub, sub))
		.limit(1);

	if (user && user.status !== "active") {
		throw new HTTPException(403, {
			message: "このアカウントは無効化されています",
		});
	}
}

/**
 * @returns MiddlewareHandler<HybridRouteContext>
 * ハイブリッド認証ミドルウェア
 * 認証されたユーザーと未認証のユーザーの両方がアクセスでき、認証済みであればsubを設定します。
 */
export function hybridAuthMiddleware(): MiddlewareHandler<HybridRouteContext> {
	return async (c, next): Promise<void> => {
		try {
			cognitoService ??= new CognitoService({
				clientId: c.env.COGNITO_CLIENT_ID,
				userPoolId: c.env.COGNITO_USER_POOL_ID,
			});
			const token = cognitoService.extractToken({
				authorizationHeader: c.req.header("Authorization"),
			});

			if (token) {
				const tokenPayload = await cognitoService.verifyAccessToken({ token });
				await assertUserActive(c.var.db, tokenPayload.sub);
				c.set("sub", tokenPayload.sub);
			} else {
				c.set("sub", null);
			}
		} catch (error) {
			if (error instanceof HTTPException) throw error;
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

			const tokenPayload = await cognitoService.verifyAccessToken({ token });
			await assertUserActive(c.var.db, tokenPayload.sub);
			c.set("sub", tokenPayload.sub);

			await next();
		} catch (error) {
			console.error("Tokenの検証に失敗しました:", error);
			if (error instanceof HTTPException) throw error;
			throw new HTTPException(401, {
				message: "無効または期限切れのトークンです",
			});
		}
	};
}
