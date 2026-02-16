import type { Api } from "@repo/api";
import { hasStatusCode } from "@repo/shared/utils";
import { type ClientResponse, hc, parseResponse } from "hono/client";
import type { StatusCode } from "hono/utils/http-status";
import { cognito } from "~/libs/cognito";

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

let refreshPromise: Promise<void> | null = null;

export async function honoFetcher<T>(
	fn: () => Promise<ClientResponse<T, StatusCode>>,
) {
	try {
		return (await parseResponse(fn())) as T;
	} catch (error) {
		if (hasStatusCode(error) && error.statusCode === 401) {
			if (!refreshPromise) {
				refreshPromise = cognito.refreshSession().finally(() => {
					refreshPromise = null;
				});
			}
			await refreshPromise;
			return (await parseResponse(fn())) as T;
		}
		throw error;
	}
}
