import type { GameState } from "@repo/db/model";
import { Spinner } from "~/components/Spinner";

export function GameWaiting({
	state,
}: {
	state: Extract<GameState, "waiting" | "setting">;
}) {
	return (
		<div className="grid">
			<Spinner />
			<p>{state === "waiting" ? "待機中..." : "設定中..."}</p>
		</div>
	);
}
