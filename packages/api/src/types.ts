import type { User } from "@repo/db/schema";
import type { HttpResponseBody } from "@repo/shared/types";
import type { Env as HonoEnv, TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Env } from "./env";
import type { DrizzleClient } from "./libs/drizzle";

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
