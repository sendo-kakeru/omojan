import type { InferRequestType } from "hono";
import useSWR from "swr";
import { honoClient } from "~/libs/apiClient.client";

async function fetcher(
	args: InferRequestType<typeof honoClient.v1.rooms.$get>,
) {
	const response = await honoClient.v1.rooms.$get(args);
	return response.json();
}

export function useRoomListSWR() {
	return useSWR("/rooms", fetcher, {
		revalidateOnFocus: false,
	});
}
