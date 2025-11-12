import type { User } from "@repo/db/schema/user";
import type { HttpResponseBody } from "@repo/shared/types";
import type { AnyD1Database, DrizzleD1Database } from "drizzle-orm/d1";
import type { Env as HonoEnv, TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Env } from "./env";

export type DrizzleClient = DrizzleD1Database<Record<string, never>> & {
	$client: AnyD1Database;
};

export type HttpRespondReturn<T = null> = Response &
	TypedResponse<HttpResponseBody<T>, ContentfulStatusCode, "json">;

export type BaseContext = HonoEnv & {
	Bindings: Env & {
		DB: AnyD1Database;
		// TODO: DurableObjectNamespace
	};
	Variables: { db: DrizzleClient };
};

export type HybridRouteContext = BaseContext & {
	Variables: { sub: User["sub"] | null };
};

export type PrivateRouteContext = BaseContext & {
	Variables: { sub: User["sub"] };
};
