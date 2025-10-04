import { drizzle as neonHttpDrizzle } from "drizzle-orm/neon-http";
import { drizzle as neonServerlessDrizzle } from "drizzle-orm/neon-serverless";
import {
	type NodePgDatabase,
	drizzle as nodePostgresDrizzle,
} from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import type { Env } from "../env";

export type DrizzleClient = NodePgDatabase<Record<string, never>> & {
	$client: Pool;
};

// NOTE: 今のDrizzleのバージョンではneonの型定義にバグがあるので無理やり型の上書きをしている https://github.com/drizzle-team/drizzle-orm/issues/3334#issuecomment-3239456692
export function getDrizzleClient({
	env,
	isWs,
}: {
	env: Env;
	/**
	 * WebSocket用のクライアントか
	 */
	isWs?: boolean;
}): DrizzleClient {
	const logger = env.ENV !== "production";

	if (env.ENV === "production" || env.ENV === "staging") {
		if (isWs) {
			return neonServerlessDrizzle(env.DATABASE_URL, {
				logger,
			}) as unknown as DrizzleClient;
		}
		return neonHttpDrizzle(env.DATABASE_URL, {
			logger,
		}) as unknown as DrizzleClient;
	}

	return nodePostgresDrizzle(env.DATABASE_URL, { logger });
}
