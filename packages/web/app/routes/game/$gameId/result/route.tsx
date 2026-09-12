import type { GameId } from "@repo/db/schema";
import { buildNoindexMeta } from "~/libs/meta";
import { decodeUuid58Param } from "~/libs/uuid58";
import { GameFinalResult } from "~/routes/game/$gameId/_index/components/GameFinalResult";
import type { Route } from "./+types/route";
import { GameResultSkeleton } from "./components/GameResultSkeleton";
import { useGameResultSWR } from "./hooks/useGameResultSWR";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

export default function Page({
	params: { gameId: encodedGameId },
}: Route.ComponentProps) {
	const gameId = decodeUuid58Param<GameId>(encodedGameId);
	const { data, error, isLoading } = useGameResultSWR(gameId);
	const result = data?.data;

	if (isLoading) {
		return <GameResultSkeleton />;
	}

	if (error) {
		return (
			<p className="py-16 text-center text-red-700">
				ゲーム結果の取得に失敗しました
			</p>
		);
	}

	if (!result) {
		return (
			<p className="py-16 text-center text-neutral-500">
				ゲーム結果が見つかりません
			</p>
		);
	}

	return <GameFinalResult result={result} />;
}
