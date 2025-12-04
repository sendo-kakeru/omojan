import { envVarSchema } from "@repo/shared/schema";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { reset } from "drizzle-seed";
import {
	type InferOutput,
	object,
	parse,
	pipe,
	safeParse,
	string,
	url,
} from "valibot";
import * as schema from "./schema";

const dotenvFileMap = {
	development: ".env.local",
	e2e: ".env.e2e",
	production: ".env.production",
	staging: ".env.staging",
} as const satisfies Record<InferOutput<typeof envVarSchema>, string>;

dotenv.config({
	path: dotenvFileMap[parse(envVarSchema, process.env.ENV ?? "development")],
});

const envSchema = object({
	DATABASE_URL: pipe(string(), url()),
	TURSO_AUTH_TOKEN: string(),
});

async function clearDatabase() {
	const env = safeParse(envSchema, process.env);

	if (!env.success) {
		throw new Error(
			`DATABASE_URL または TURSO_AUTH_TOKEN が設定されていません: ${env.issues.map((issue) => issue.message).join("\n")}`,
		);
	}

	const db = drizzle({
		connection: {
			authToken: env.output.TURSO_AUTH_TOKEN,
			url: env.output.DATABASE_URL,
		},
	});
	await reset(db, schema);
}

void (async () => {
	await clearDatabase();
})();
