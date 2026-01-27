import type { GetRoomListRequestQuery } from "@repo/db/model";
import useSWR from "swr";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

export function useRoomListSWR({
	status = "waiting",
	page,
	limit,
}: GetRoomListRequestQuery = {}) {
	const query: GetRoomListRequestQuery = { status };

	if (page) query.page = page;
	if (limit) query.limit = limit;

	const key = `/rooms?${new URLSearchParams({
		limit: query.limit?.toString() ?? "",
		page: query.page?.toString() ?? "",
		status: query.status ?? "",
	}).toString()}`;

	const result = useSWR(key, () =>
		honoFetcher(() => honoClient.v1.rooms.$get({ query })),
	);
	return { ...result, data: result.data?.data };
}
