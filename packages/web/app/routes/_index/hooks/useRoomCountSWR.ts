import type { GetRoomCountRequestQuery } from "@repo/db/model";
import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

const fetchRoomCount = (query: GetRoomCountRequestQuery) =>
	honoFetcher(() => honoClient.v1.rooms.count.$get({ query }));

type RoomCountData = Awaited<ReturnType<typeof fetchRoomCount>>;

export function useRoomCountSWR({
	status = "active",
	fallbackData,
}: GetRoomCountRequestQuery & { fallbackData?: RoomCountData } = {}) {
	const query: GetRoomCountRequestQuery = { status };

	const key = `/rooms/count?${new URLSearchParams({
		status: query.status ?? "",
	}).toString()}`;

	const result = useSWR(key, () => fetchRoomCount(query), { fallbackData });
	// SWR v2ではfallbackDataは「読み込み済みデータ」と見なされず、isLoadingがtrueのままになる。
	// fallbackDataでdataが存在する場合はisLoadingをfalseにすることで、SSR時のスケルトン表示を防ぐ。
	const isLoading = !result.error && !result.data && result.isLoading;
	return { ...result, data: result.data?.data, isLoading };
}
