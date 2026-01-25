import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

// TODO: クエリ対応
export function useRoomListSWR() {
	return useSWR("/rooms", () =>
		honoFetcher(() => honoClient.v1.rooms.$get({ query: {} })),
	);
}
