import { execSync } from "node:child_process";
import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";

export function createTestDbClient() {
	const root = execSync("git rev-parse --show-toplevel", {
		encoding: "utf8",
	}).trim();
	const dbFile = `${root}/packages/db/src/local.db`;

	const client = createClient({ url: `file:${dbFile}` });
	return drizzle(client);
}
