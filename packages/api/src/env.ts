import {
	type InferOutput,
	literal,
	object,
	pipe,
	string,
	union,
	url,
} from "valibot";

export const envSchema = object({
	COGNITO_CLIENT_ID: string(),

	// Cognito認証設定
	COGNITO_USER_POOL_ID: string(),
	DATABASE_URL: pipe(string(), url()),
	ENV: union([
		literal("development"),
		literal("staging"),
		literal("production"),
	]),
	JWT_SECRET: string(),
	WEB_URL: pipe(string(), url()),
});

export type Env = InferOutput<typeof envSchema>;
