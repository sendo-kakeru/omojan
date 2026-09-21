import * as schema from "@repo/db/schemas";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { reset } from "drizzle-seed";
import { object, pipe, safeParse, string, url } from "valibot";

dotenv.config({
	path: ".env.e2e",
});

const envSchema = object({
	DATABASE_URL: pipe(string(), url()),
	TURSO_AUTH_TOKEN: string(),
});

export default async function globalTeardown() {
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
