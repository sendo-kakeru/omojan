import { wrapRequestHandler } from "@sentry/cloudflare";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext } from "../app/libs/cloudflareContext";
import { maintenanceHtml } from "./maintenance";

type WebEnv = Omit<Env, "MAINTENANCE_MODE"> & {
	MAINTENANCE_MODE: string;
};

export default {
	async fetch(request, env: WebEnv, executionContext: ExecutionContext) {
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

		const requestHandler = createRequestHandler(
			() => import("virtual:react-router/server-build"),
			import.meta.env.MODE,
		);

		return wrapRequestHandler(
			{
				context: executionContext,
				options: {
					dsn: "https://0059254ef5a4ea86918e8a1721f51288@o4511000575541248.ingest.us.sentry.io/4511000584192000",
					sendDefaultPii: true,
				},
				request: request,
			},
			() => {
				const routerContext = new RouterContextProvider();
				routerContext.set(cloudflareContext, {
					ctx: executionContext,
					env: env as Env,
				});

				return requestHandler(request, routerContext);
			},
		);
	},
} satisfies ExportedHandler<WebEnv>;
