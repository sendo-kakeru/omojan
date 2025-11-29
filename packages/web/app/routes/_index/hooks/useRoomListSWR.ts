import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

export function useRoomListSWR() {
	return useSWR("/rooms", () => honoFetcher(() => honoClient.v1.rooms.$get()), {
		revalidateOnFocus: false,
	});
}
