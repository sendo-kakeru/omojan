import type {
	GameClientSubmissionMessage,
	GameServerMessage,
} from "@repo/db/model";
import { GameSubmission } from "./GameSubmission";

export function GamePresenter({
	data,
	sendSubmission,
}: {
	data: GameServerMessage;
	sendSubmission: (message: GameClientSubmissionMessage["submission"]) => void;
}) {
	if (
		data.type === "ROUND_START" ||
		data.type === "TURN_START" ||
		data.type === "TURN_END"
	) {
		return <GameSubmission data={data} sendSubmission={sendSubmission} />;
	}
	// TODO: VOTE_START, RESULT の処理
	return null;
}
