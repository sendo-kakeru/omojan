import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
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

export default defineConfig({
	define: {
		global: "globalThis",
	},
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
		ValibotEnvPlugin(webClientEnvSchema),
	],
});
