/// <reference types="node" />

import { envVarSchema } from "@repo/shared/schema";
import dotenv from "dotenv";
import { type Config, defineConfig } from "drizzle-kit";
import {
	type InferOutput,
	object,
	parse,
	pipe,
	safeParse,
	string,
	url,
} from "valibot";

const dotenvFileMap = {
	development: ".env.local",
	production: ".env.production",
	staging: ".env.staging",
} as const satisfies Record<InferOutput<typeof envVarSchema>, string>;

dotenv.config({
	path: dotenvFileMap[parse(envVarSchema, process.env.ENV ?? "development")],
});

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
