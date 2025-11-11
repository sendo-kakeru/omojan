import type { D1Database } from "./types/d1";
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
        COGNITO_USER_POOL_ID: string(),
        ENV: union([
                literal("development"),
                literal("staging"),
                literal("production"),
        ]),
        JWT_SECRET: string(),
        WEB_URL: pipe(string(), url()),
});

export type EnvVars = InferOutput<typeof envSchema>;

export type Env = EnvVars & { DB: D1Database };
