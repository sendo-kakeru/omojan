import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { sentryReactRouter } from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { object, pipe, string, url } from "valibot";
import { defineConfig } from "vite";
import ValibotEnvPlugin from "vite-plugin-valibot-env";
import tsconfigPaths from "vite-tsconfig-paths";

export const webClientEnvSchema = object({
	VITE_API_URL: pipe(string(), url()),
	VITE_COGNITO_CLIENT_ID: string(),
	VITE_COGNITO_DOMAIN: pipe(string(), url()),
	VITE_COGNITO_USER_POOL_ID: string(),
});

export default defineConfig((config) => ({
	define: {
		global: "globalThis",
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		ValibotEnvPlugin(webClientEnvSchema),
		sentryReactRouter(
			{
				// An auth token is required for uploading source maps;
				// store it in an environment variable to keep it secure.
				authToken: process.env.SENTRY_AUTH_TOKEN,
				org: "b7d94dc9e89b",
				project: "node-cloudflare-workers",
			},
			config,
		),
	],
}));
