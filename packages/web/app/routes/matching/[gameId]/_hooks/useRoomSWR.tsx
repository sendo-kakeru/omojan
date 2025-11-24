import type { InferRequestType } from "hono";
import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

type Args = InferRequestType<(typeof honoClient.v1.rooms)[":gameId"]["$get"]>;

export function useRoomSWR(args: Args) {
	const { data, error, isLoading, mutate } = useSWR(
		`/rooms/${args.param.gameId}`,
		() => honoFetcher(() => honoClient.v1.rooms[":gameId"].$get(args)),
		{
			revalidateOnFocus: false,
		},
	);

	return { data: data?.data, error, isLoading, mutate };
}
