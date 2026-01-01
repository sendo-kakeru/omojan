import { drizzle } from "drizzle-orm/libsql";
import type { Env } from "../env";

export function createDrizzleClient(env: Env) {
	return drizzle({
		connection: {
			authToken: env.TURSO_AUTH_TOKEN,
			url: env.DATABASE_URL,
		},
	});
}

export type DrizzleClient = ReturnType<typeof createDrizzleClient>;
