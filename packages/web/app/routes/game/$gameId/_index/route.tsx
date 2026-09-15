import type { GameId } from "@repo/db/schema";
import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { useNavigate } from "react-router";
import { Spinner } from "~/components/Spinner";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import { buildNoindexMeta } from "~/libs/meta";
import { decodeUuid58Param } from "~/libs/uuid58";
import type { Route } from "./+types/route";
import { GameError } from "./components/GameError";
import { GamePresenter } from "./components/GamePresenter";
import { ReactionBar } from "./components/ReactionBar";
import { ReactionOverlay } from "./components/ReactionOverlay";
import { useGameSubscriptionSWR } from "./hooks/useGameSubscriptionSWR";
import { useReactions } from "./hooks/useReactions";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

export default function Page({
	params: { gameId: encodedGameId },
}: Route.ComponentProps) {
	const gameId = decodeUuid58Param<GameId>(encodedGameId);
	const navigate = useNavigate();
	const gameToken = gameTokenLocalStorage.get({
		onError() {
			alert(LOCALSTORAGE_OPERATION_FAILED_MESSAGE);
			void navigate("/", { replace: true });
		},
	});

	const { addReaction, reactions } = useReactions();

	const { data, error, sendReaction, sendSubmission, sendVote, wsRef } =
		useGameSubscriptionSWR({
			gameId,
			gameToken,
			onReaction: addReaction,
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

	const isMySubmittingTurn =
		data.type === "TURN_START" && data.currentPlayerId === data.mePlayer.id;

	const showReactionBar = data.type !== "END" && !isMySubmittingTurn;

	return (
		<>
			<ReactionOverlay reactions={reactions} />
			<GamePresenter
				data={data}
				reactionBar={
					<ReactionBar sendReaction={sendReaction} visible={showReactionBar} />
				}
				sendSubmission={sendSubmission}
				sendVote={sendVote}
			/>
		</>
	);
}
