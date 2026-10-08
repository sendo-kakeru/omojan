import type {
	GameClientSubmissionMessage,
	GameClientVoteMessage,
	GameServerMessage,
} from "@repo/db/models";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { GameResult } from "./GameResult";
import { GameSubmission } from "./GameSubmission";
import { GameVote } from "./GameVote";

export function GamePresenter({
	data,
	reactionBar,
	sendSubmission,
	sendVote,
}: {
	data: GameServerMessage;
	reactionBar?: ReactNode;
	sendSubmission: (
		message: GameClientSubmissionMessage["submission"],
	) => Promise<void>;
	sendVote: (
		votePlayerId: GameClientVoteMessage["votePlayerId"],
	) => Promise<void>;
}) {
	const navigate = useNavigate();
	const { gameId: encodedGameId } = useParams();

	useEffect(() => {
		if (data.type === "END") {
			void navigate(`/game/${encodedGameId}/result`, { replace: true });
		}
	}, [data.type, encodedGameId, navigate]);

	if (
		data.type === "ROUND_START" ||
		data.type === "TURN_START" ||
		data.type === "TURN_END"
	) {
		return (
			<GameSubmission
				data={data}
				reactionBar={reactionBar}
				sendSubmission={sendSubmission}
			/>
		);
	}
	if (data.type === "VOTE_START") {
		return (
			<GameVote data={data} reactionBar={reactionBar} sendVote={sendVote} />
		);
	}
	if (data.type === "RESULT") {
		return <GameResult data={data} reactionBar={reactionBar} />;
	}
	return null;
}
