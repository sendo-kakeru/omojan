import type { User } from "@repo/db/schema/user";
import type { Env as HonoEnv, TypedResponse } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Env } from "./env";

export type HttpResponseBody<T> = {
	data: T;
	message: string;
};

export type HttpRespondReturn<T = null> = Response &
	TypedResponse<HttpResponseBody<T>, ContentfulStatusCode, "json">;

export type BaseContext = HonoEnv & {
	Bindings: Env & {
		ROOM: DurableObjectNamespace;
	};
};

export type HybridRouteContext = BaseContext & {
	Variables: { sub: User["sub"] | null };
};

export type PrivateRouteContext = BaseContext & {
	Variables: { sub: User["sub"] };
};
