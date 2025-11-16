import type { Client } from "@libsql/client";
import type { User } from "@repo/db/schema/user";
import type { HttpResponseBody } from "@repo/shared/types";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { Env as HonoEnv, TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Env } from "./env";
export type DrizzleClient = LibSQLDatabase<Record<string, never>> & {
	$client: Client;
};

export type HttpRespondReturn<T = null> = Response &
	TypedResponse<HttpResponseBody<T>, ContentfulStatusCode, "json">;

export type BaseContext = HonoEnv & {
	Bindings: Env & {
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
