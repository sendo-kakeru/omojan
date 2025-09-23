import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import type { Env } from "env";
import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const encoder = new TextEncoder();

function stringTimingSafeEqual(a: string, b: string) {
	const aBytes = encoder.encode(a);
	const bBytes = encoder.encode(b);

	if (aBytes.byteLength !== bBytes.byteLength) {
		return false;
	}

	return timingSafeEqual(aBytes, bBytes);
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env: Env, ctx) {
		if (env.ENV === "staging" || env.ENV === "production") {
			if (!env.BASIC_AUTH_USERNAME || !env.BASIC_AUTH_PASSWORD) {
				console.error(
					"BASIC_AUTH_USERNAME か BASIC_AUTH_PASSWORD が設定されていません。",
				);
				return new Response("Internal Server Error", { status: 500 });
			}

			const authorization = request.headers.get("Authorization");
			if (!authorization) {
				return new Response("ログインする必要があります。", {
					headers: {
						"WWW-Authenticate":
							'Basic realm="developer scope", charset="UTF-8"',
					},
					status: 401,
				});
			}

			const [scheme, encoded] = authorization.split(" ");
			if (!encoded || scheme !== "Basic") {
				return new Response("不正な認証ヘッダーです。", {
					status: 400,
				});
			}

			const credentials = Buffer.from(encoded, "base64").toString();
			const index = credentials.indexOf(":");
			const user = credentials.substring(0, index);
			const password = credentials.substring(index + 1);

			if (
				!stringTimingSafeEqual(env.BASIC_AUTH_USERNAME, user) ||
				!stringTimingSafeEqual(env.BASIC_AUTH_PASSWORD, password)
			) {
				return new Response("ログインする必要があります。", {
					headers: {
						"WWW-Authenticate":
							'Basic realm="developer scope", charset="UTF-8"',
					},
					status: 401,
				});
			}
		}

		return requestHandler(request, {
			cloudflare: { ctx, env },
		});
	},
} satisfies ExportedHandler<Env>;
