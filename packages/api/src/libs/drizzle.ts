import * as schema from "@repo/db/schema/index";
import { drizzle } from "drizzle-orm/d1";
import type { Env } from "../env";

function createClient(env: Pick<Env, "DB" | "ENV">) {
	return drizzle(env.DB, {
		casing: "snake_case",
		logger: env.ENV !== "production",
		schema,
	});
}

export type DrizzleClient = ReturnType<typeof createClient>;

export function getDrizzleClient({
	env,
}: {
	env: Pick<Env, "DB" | "ENV">;
}): DrizzleClient {
	return createClient(env);
}
