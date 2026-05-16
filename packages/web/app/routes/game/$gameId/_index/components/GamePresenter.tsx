import type {
	GameClientSubmissionMessage,
	GameClientVoteMessage,
	GameServerMessage,
} from "@repo/db/model";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { GameResult } from "./GameResult";
import { GameSubmission } from "./GameSubmission";
import { GameVote } from "./GameVote";

export function GamePresenter({
	data,
	sendSubmission,
	sendVote,
}: {
	data: GameServerMessage;
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
		return <GameSubmission data={data} sendSubmission={sendSubmission} />;
	}
	if (data.type === "VOTE_START") {
		return <GameVote data={data} sendVote={sendVote} />;
	}
	if (data.type === "RESULT") {
		return <GameResult data={data} />;
	}
	return null;
}
