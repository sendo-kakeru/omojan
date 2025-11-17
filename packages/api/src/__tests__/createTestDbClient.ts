import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";

export function createTestDbClient() {
	const dbFile = process.env.TEST_DB_FILE;

	const client = createClient({ url: `file:${dbFile}` });
	return drizzle(client);
}
