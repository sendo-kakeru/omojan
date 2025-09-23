import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import * as v from "valibot";
import { defineConfig } from "vite";
import ValibotEnvPlugin from "vite-plugin-valibot-env";
import tsconfigPaths from "vite-tsconfig-paths";

export const webClientEnvSchema = v.object({
	VITE_API_URL: v.pipe(v.string(), v.url()),
	VITE_COGNITO_CLIENT_ID: v.string(),
	VITE_COGNITO_DOMAIN: v.pipe(v.string(), v.url()),
	VITE_COGNITO_USER_POOL_ID: v.string(),
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
