import { envVarSchema } from "@repo/shared/schema";
import { type InferOutput, object, optional, pipe, string, url } from "valibot";

export const envSchema = object({
	COGNITO_CLIENT_ID: string(),

	// Cognito認証設定
	COGNITO_USER_POOL_ID: string(),
	DATABASE_URL: pipe(string(), url()),
	ENV: envVarSchema,
	JWT_SECRET: string(),
	// R2バケットの公開URL（Image Transformations用、ローカル開発ではオプショナル）
	MEDIA_BUCKET_PUBLIC_URL: optional(pipe(string(), url())),
	TURSO_AUTH_TOKEN: string(),
	WEB_URL: pipe(string(), url()),
});

export type Env = InferOutput<typeof envSchema>;
