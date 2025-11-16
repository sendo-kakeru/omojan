/// <reference types="node" />
import { type Config, defineConfig } from "drizzle-kit";
import { object, pipe, safeParse, string, url } from "valibot";

const env = safeParse(
	object({
		DATABASE_URL: pipe(string(), url()),
		TURSO_AUTH_TOKEN: string(),
	}),
	process.env,
);
if (!env.success) {
	throw new Error(
		`DATABASE_URL または TURSO_AUTH_TOKEN が設定されていません: ${env.issues.map((issue) => issue.message).join("\n")}`,
	);
}

export default defineConfig({
	casing: "snake_case",
	dbCredentials: {
		authToken: env.output.TURSO_AUTH_TOKEN,
		url: env.output.DATABASE_URL,
	},
	dialect: "turso",
	out: "./src/migrations",
	schema: "./src/schema",
}) satisfies Config;
