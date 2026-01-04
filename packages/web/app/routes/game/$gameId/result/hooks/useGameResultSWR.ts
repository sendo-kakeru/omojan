import type { GameId } from "@repo/db/schema";
import useSWRImmutable from "swr/immutable";
import { honoClient, honoFetcher } from "~/libs/apiClient.client";

export function useGameResultSWR(gameId: GameId) {
	return useSWRImmutable(`/games/${gameId}/result`, () =>
		honoFetcher(() =>
			honoClient.v1.games[":gameId"].result.$get({
				param: { gameId },
			}),
		),
	);
}
