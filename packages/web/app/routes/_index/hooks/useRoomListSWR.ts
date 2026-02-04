import type { GetRoomListRequestQuery } from "@repo/db/model";
import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

const fetchRoomList = (query: GetRoomListRequestQuery) =>
	honoFetcher(() => honoClient.v1.rooms.$get({ query }));

type RoomListData = Awaited<ReturnType<typeof fetchRoomList>>;

export function useRoomListSWR({
	status = "waiting",
	page,
	limit,
	fallbackData,
}: GetRoomListRequestQuery & { fallbackData?: RoomListData } = {}) {
	const query: GetRoomListRequestQuery = { status };

	if (page) query.page = page;
	if (limit) query.limit = limit;

	const key = `/rooms?${new URLSearchParams({
		limit: query.limit?.toString() ?? "",
		page: query.page?.toString() ?? "",
		status: query.status ?? "",
	}).toString()}`;

	const result = useSWR(key, () => fetchRoomList(query), { fallbackData });
	// SWR v2ではfallbackDataは「読み込み済みデータ」と見なされず、isLoadingがtrueのままになる。
	// fallbackDataでdataが存在する場合はisLoadingをfalseにすることで、SSR時のスケルトン表示を防ぐ。
	const isLoading = !result.error && !result.data && result.isLoading;
	return { ...result, data: result.data?.data, isLoading };
}
