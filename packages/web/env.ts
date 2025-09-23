import * as v from "valibot";

const serverEnvSchema = v.variant("ENV", [
	v.object({
		BASIC_AUTH_PASSWORD: v.string(),
		BASIC_AUTH_USERNAME: v.string(),
		ENV: v.literal("production"),
	}),
	v.object({
		BASIC_AUTH_PASSWORD: v.string(),
		BASIC_AUTH_USERNAME: v.string(),
		ENV: v.literal("staging"),
	}),
	v.object({
		ENV: v.literal("development"),
	}),
]);

export type Env = v.InferOutput<typeof serverEnvSchema>;
