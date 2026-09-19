import { CognitoService } from "@repo/shared/libs/cognito";
import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { MeService } from "../application/me/MeService";
import type {
	BaseContext,
	HybridRouteContext,
	PrivateRouteContext,
	RegistrationRouteContext,
} from "../types";

/**
 * CognitoService のインスタンスキャッシュ。
 * リクエストごとの再生成を避け、内部の JWKS キャッシュを
 * 同一 isolate 内で再利用する。
 */
let cognitoService: CognitoService | null = null;

/** Authorization ヘッダーのアクセストークンを検証して sub を返却 */
async function authenticate(
	c: Pick<Context<BaseContext>, "env" | "req">,
): Promise<string | null> {
	cognitoService ??= new CognitoService({
		clientId: c.env.COGNITO_CLIENT_ID,
		userPoolId: c.env.COGNITO_USER_POOL_ID,
	});
	const token = cognitoService.extractToken({
		authorizationHeader: c.req.header("Authorization"),
	});

	if (!token) return null;

	try {
		const tokenPayload = await cognitoService.verifyAccessToken({ token });
		return tokenPayload.sub;
	} catch (error) {
		console.error("Tokenの検証に失敗しました:", error);
		return null;
	}
}

/**
 * ハイブリッド認証ミドルウェア
 * 認証されたユーザーと未認証のユーザーの両方がアクセスでき、認証済みであれば auth を設定します。
 */
export function hybridAuthMiddleware(): MiddlewareHandler<HybridRouteContext> {
	return async (c, next): Promise<void> => {
		const sub = await authenticate(c);

		if (sub) {
			const findResult = await new MeService(c.var.db)
				.findBySub({ sub })
				.catch((error) => {
					console.error("ユーザー情報の取得に失敗しました:", error);
					throw new HTTPException(500, {
						message: "ユーザー情報の取得に失敗しました",
					});
				});
			c.set(
				"auth",
				findResult?.status === "active" ? { me: findResult.me, sub } : null,
			);
		} else {
			c.set("auth", null);
		}

		await next();
	};
}

/**
 * プライベート認証ミドルウェア
 * 有効な登録済みユーザーのみがアクセスでき、 auth を設定します。
 */
export function privateAuthMiddleware(): MiddlewareHandler<PrivateRouteContext> {
	return async (c, next): Promise<void> => {
		const sub = await authenticate(c);

		if (!sub) {
			throw new HTTPException(401, { message: "認証が必要です" });
		}

		const foundResult = await new MeService(c.var.db)
			.findBySub({ sub })
			.catch((error) => {
				console.error("ユーザー情報の取得に失敗しました:", error);
				throw new HTTPException(500, {
					message: "ユーザー情報の取得に失敗しました",
				});
			});

		if (!foundResult) {
			throw new HTTPException(404, { message: "ユーザーが存在しません" });
		}

		if (foundResult.status !== "active") {
			throw new HTTPException(403, {
				message: "このアカウントは無効化されています",
			});
		}

		c.set("auth", { me: foundResult.me, sub });

		await next();
	};
}

/**
 * 登録処理用の認証ミドルウェア
 * users はこれから作る段階なので、 sub のみを Context に渡す。
 */
export function registrationAuthMiddleware(): MiddlewareHandler<RegistrationRouteContext> {
	return async (c, next): Promise<void> => {
		const sub = await authenticate(c);

		if (!sub) {
			throw new HTTPException(401, { message: "認証が必要です" });
		}

		c.set("auth", { sub });

		await next();
	};
}
