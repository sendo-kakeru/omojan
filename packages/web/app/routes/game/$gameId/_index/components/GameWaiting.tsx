import type { GameState } from "@repo/db/model";
import { Spinner } from "~/components/Spinner";
import { tileClassName } from "~/components/Tile";

export function GameWaiting({
	state,
}: {
	state: Extract<GameState, "waiting" | "setting">;
}) {
	return (
		<div className="grid min-h-svh place-items-center">
			<div
				className={tileClassName({
					className: "grid place-items-center gap-y-12 px-32 py-24",
					stand: "gold",
				})}
			>
				<Spinner className="size-32 text-moss" />
				<p className="font-bold text-moss text-sm">
					{state === "waiting"
						? "他のプレイヤーを待っています..."
						: "卓を準備しています..."}
				</p>
			</div>
		</div>
	);
}
