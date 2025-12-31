import type { GameServerMessage } from "@repo/db/model";
import { GameSubmission } from "./GameSubmission";

export function GamePresenter({ data }: { data: GameServerMessage }) {
	if (
		data.type === "ROUND_START" ||
		data.type === "TURN_START" ||
		data.type === "TURN_END"
	) {
		return <GameSubmission data={data} />;
	}
	// TODO: VOTE_START, RESULT の処理
	return null;
}
