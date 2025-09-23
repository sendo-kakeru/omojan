import { type InferOutput, literal, object, string, variant } from "valibot";

const serverEnvSchema = variant("ENV", [
	object({
		BASIC_AUTH_PASSWORD: string(),
		BASIC_AUTH_USERNAME: string(),
		ENV: literal("production"),
	}),
	object({
		BASIC_AUTH_PASSWORD: string(),
		BASIC_AUTH_USERNAME: string(),
		ENV: literal("staging"),
	}),
	object({
		ENV: literal("development"),
	}),
]);

export type Env = InferOutput<typeof serverEnvSchema>;
