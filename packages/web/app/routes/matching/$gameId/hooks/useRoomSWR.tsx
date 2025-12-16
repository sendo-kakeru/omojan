import type { InferRequestType } from "hono";
import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

type Args = InferRequestType<(typeof honoClient.v1.rooms)[":roomId"]["$get"]>;

export function useRoomSWR(args: Args) {
	const { data, error, isLoading, mutate } = useSWR(
		[`/rooms/${args.param.roomId}`, args.header["x-game-token"]],
		() => honoFetcher(() => honoClient.v1.rooms[":roomId"].$get(args)),
		{
			revalidateOnFocus: false,
		},
	);

	return { data: data?.data, error, isLoading, mutate };
}
