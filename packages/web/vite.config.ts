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
	server: {
		// NOTE: 起動時に全クライアントモジュールを変換させ、依存の事前バンドルを完了させる。
		// これを省くとリクエスト到達時に依存が新規発見されて再最適化が走り、その間に読み込まれたページは 504 (Outdated Optimize Dep) でクライアント JS を取得できずハイドレーションされない（E2E が dev サーバー上で動くため実害が出る）。
		warmup: {
			clientFiles: ["./app/**/*.ts", "./app/**/*.tsx"],
		},
	},
}));
