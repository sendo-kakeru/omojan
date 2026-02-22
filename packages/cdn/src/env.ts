import { type InferOutput, object, optional, pipe, string, url } from "valibot";

export const gcpServiceAccountKeySchema = object({
	client_email: string(),
	private_key: string(),
});

export type GcpServiceAccountKey = InferOutput<
	typeof gcpServiceAccountKeySchema
>;

export const envSchema = object({
	COGNITO_CLIENT_ID: string(),
	COGNITO_USER_POOL_ID: string(),
	GCP_SERVICE_ACCOUNT_KEY: optional(string()),
	ORIGIN_URL: pipe(string(), url()),
	WEB_URL: pipe(string(), url()),
});

export type Env = InferOutput<typeof envSchema>;
