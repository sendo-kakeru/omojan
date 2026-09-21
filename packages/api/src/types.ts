import type { Me } from "@repo/db/models";
import type { User } from "@repo/db/schemas";
import type { Env as HonoEnv } from "hono";
import type { Env } from "./env";
import type { DrizzleClient } from "./libs/drizzle";

/** リクエストの認証情報 */
type Auth = {
	sub: User["sub"];
	me: Me;
};

/**
 * ユーザー登録中用の認証情報
 * users はこれから作られるため、トークン由来の sub のみ
 */
type RegistrationAuth = {
	sub: User["sub"];
};

export type BaseContext = HonoEnv & {
	Bindings: Env & {
		CDN_WORKER: Fetcher;
		GAME_DURABLE_OBJECT: DurableObjectNamespace;
		MATCHING_DURABLE_OBJECT: DurableObjectNamespace;
	};
	Variables: { db: DrizzleClient };
};

/** auth が null なら未ログインを表す（未認証・未登録・無効化なども未ログイン要因） */
export type HybridRouteContext = BaseContext & {
	Variables: { auth: Auth | null };
};

export type PrivateRouteContext = BaseContext & {
	Variables: { auth: Auth };
};

export type RegistrationRouteContext = BaseContext & {
	Variables: { auth: RegistrationAuth };
};
