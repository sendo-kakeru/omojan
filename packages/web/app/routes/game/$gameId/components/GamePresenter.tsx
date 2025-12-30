import type { GameState } from "@repo/db/model";
import { GameResult } from "./GameResult";
import { GameSubmission } from "./GameSubmission";
import { GameVote } from "./GameVote";
import { GameWaiting } from "./GameWaiting";

export function GamePresenter({ state }: { state: GameState }) {
	if (state === "waiting" || state === "setting") {
		return <GameWaiting state={state} />;
	}
	if (state === "submission") {
		return <GameSubmission />;
	}
	if (state === "voting") {
		return <GameVote />;
	}
	if (state === "result") {
		return <GameResult />;
	}
	return null;
}
