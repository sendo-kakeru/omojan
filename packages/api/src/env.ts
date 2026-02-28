import { envVarSchema } from "@repo/shared/schema";
import { type InferOutput, object, pipe, string, url } from "valibot";

export const envSchema = object({
	COGNITO_CLIENT_ID: string(),

	// Cognito認証設定
	COGNITO_USER_POOL_ID: string(),
	DATABASE_URL: pipe(string(), url()),
	DISCORD_WEBHOOK_URL: pipe(string(), url()),
	ENV: envVarSchema,
	JWT_SECRET: string(),
	TURSO_AUTH_TOKEN: string(),
	WEB_URL: pipe(string(), url()),
});

export type Env = InferOutput<typeof envSchema>;
