import type { User } from "@repo/db/schema";
import type { Env as HonoEnv } from "hono";
import type { Env } from "./env";
import type { DrizzleClient } from "./libs/drizzle";

export type BaseContext = HonoEnv & {
	Bindings: Env & {
		GAME_DURABLE_OBJECT: DurableObjectNamespace;
		MATCHING_DURABLE_OBJECT: DurableObjectNamespace;
	};
	Variables: { db: DrizzleClient };
};

export type HybridRouteContext = BaseContext & {
	Variables: { sub: User["sub"] | null };
};

export type PrivateRouteContext = BaseContext & {
	Variables: { sub: User["sub"] };
};
