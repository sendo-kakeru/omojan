import type { InferRequestType } from "hono";
import useSWR from "swr";
import { honoClient } from "~/libs/apiClient.client";

async function fetcher(args: InferRequestType<typeof honoClient.rooms.$get>) {
	const response = await honoClient.rooms.$get(args);
	return response.json();
}

export function useGameListSWR() {
	return useSWR("/rooms", fetcher, {
		revalidateOnFocus: false,
	});
}
