import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { useNavigate } from "react-router";
import { Spinner } from "~/components/Spinner";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import { buildNoindexMeta } from "~/libs/meta";
import type { Route } from "./+types/route";
import { GameError } from "./components/GameError";
import { GamePresenter } from "./components/GamePresenter";
import { useGameSubscriptionSWR } from "./hooks/useGameSubscriptionSWR";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

export default function Page({ params: { gameId } }: Route.ComponentProps) {
	const navigate = useNavigate();
	const gameToken = gameTokenLocalStorage.get({
		onError() {
			alert(LOCALSTORAGE_OPERATION_FAILED_MESSAGE);
			void navigate("/", { replace: true });
		},
	});

	const { data, error, sendSubmission, sendVote, wsRef } =
		useGameSubscriptionSWR({
			gameId,
			gameToken,
		});

	if (error) {
		return <GameError errorType="unknown" />;
	}

	if (!WebSocket || wsRef.current?.readyState !== WebSocket.OPEN || !data) {
		return (
			<main className="grid place-items-center gap-y-20 py-24 text-neutral-500">
				<Spinner className="size-32" />
				<p className="animate-bounce text-center">
					{data?.type === "END"
						? "結果に進みます..."
						: "ゲームを開始しています…"}
				</p>
			</main>
		);
	}

	return (
		<GamePresenter
			data={data}
			sendSubmission={sendSubmission}
			sendVote={sendVote}
		/>
	);
}
