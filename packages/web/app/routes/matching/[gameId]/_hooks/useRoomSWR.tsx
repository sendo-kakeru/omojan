import type { InferRequestType } from "hono";
import useSWR from "swr";
import { honoClient } from "~/libs/apiClient.client";

type Args = InferRequestType<(typeof honoClient.v1.rooms)[":gameId"]["$get"]>;

async function fetcher(args: Args) {
	const response = await honoClient.v1.rooms[":gameId"].$get(args);
	return response.json();
}

export function useRoomSWR(args: Args) {
	return useSWR(["/rooms", args.param.gameId], () => fetcher(args), {
		revalidateOnFocus: false,
	});
}
