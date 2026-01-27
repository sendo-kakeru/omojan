import type { GameId } from "@repo/db/schema";
import { Spinner } from "~/components/Spinner";
import { GameFinalResult } from "~/routes/game/$gameId/_index/components/GameFinalResult";
import type { Route } from "./+types/route";
import { useGameResultSWR } from "./hooks/useGameResultSWR";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	const { data, error, isLoading } = useGameResultSWR(gameId as GameId);
	const result = data?.data;

	if (isLoading) {
		return (
			<div className="grid place-items-center gap-y-4 py-16 text-neutral-500">
				<Spinner className="size-32" />
				<p className="text-center">ゲーム結果を取得中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-red-500">
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
