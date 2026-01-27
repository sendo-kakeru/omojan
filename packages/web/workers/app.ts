import { createRequestHandler } from "react-router";
import { maintenanceHtml } from "./maintenance";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

type WebEnv = Omit<Env, "MAINTENANCE_MODE"> & {
	MAINTENANCE_MODE: string;
};

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env: WebEnv, ctx) {
		// メンテナンスモードチェック（Cloudflare Dashboardで "true" に変更可能）
		if (env.MAINTENANCE_MODE === "true") {
			return new Response(maintenanceHtml(), {
				headers: {
					"Content-Type": "text/html; charset=utf-8",
					"Retry-After": "3600",
				},
				status: 503,
			});
		}

		return requestHandler(request, {
			cloudflare: { ctx, env: env as Env },
		});
	},
} satisfies ExportedHandler<WebEnv>;
