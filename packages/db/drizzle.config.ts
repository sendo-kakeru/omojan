/// <reference types="node" />

import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import { defineConfig } from "drizzle-kit";

const SQLITE_DIR_PATH =
	"../api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const SQLITE_FILE_NAME = "local-d1-main.sqlite";

const resolvedLocalSqlitePath = (() => {
	try {
		const dirPath = dirname(`${SQLITE_DIR_PATH}/placeholder`);

		if (!existsSync(dirPath)) {
			mkdirSync(dirPath, { recursive: true });
		}

		const sqliteFiles = readdirSync(SQLITE_DIR_PATH).filter((file) =>
			file.endsWith(".sqlite"),
		);
		const targetFile = sqliteFiles.find((file) => file !== SQLITE_FILE_NAME);

		return `${SQLITE_DIR_PATH}/${targetFile}`;
	} catch {
		return undefined;
	}
})();

if (
	process.env.NODE_ENV !== "production" &&
	process.env.NODE_ENV !== "staging" &&
	!resolvedLocalSqlitePath
) {
	throw new Error("ローカル D1 の SQLite ファイルが見つかりません。");
}

export default defineConfig({
	casing: "snake_case",
	dialect: "sqlite",
	out: "./src/migrations",
	schema: "./src/schema",
	...(process.env.NODE_ENV === "production" ||
	process.env.NODE_ENV === "staging"
		? {
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_D1_ACCOUNT_ID,
					databaseId: process.env.CLOUDFLARE_DATABASE_ID,
					token: process.env.CLOUDFLARE_D1_API_TOKEN,
				},
				driver: "d1-http",
			}
		: resolvedLocalSqlitePath
			? {
					dbCredentials: {
						url: resolvedLocalSqlitePath,
					},
				}
			: {}),
});
