import type { Api } from "@repo/api";
import { hc } from "hono/client";
import { cognito } from "~/libs/cognito";

// TODO: リフレッシュ後の再リクエスト
export const honoClient = hc<Api>(import.meta.env.VITE_API_URL, {
	async headers() {
		const accessToken = await cognito.getAccessToken();
		const headers: Record<string, string> = {};

		if (accessToken) {
			headers.Authorization = `Bearer ${accessToken}`;
		}

		return headers;
	},
});
