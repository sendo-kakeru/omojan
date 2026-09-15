import { getDisplayName } from "~/libs/displayName";
import type { Reaction } from "../hooks/useReactions";

export function ReactionOverlay({ reactions }: { reactions: Reaction[] }) {
	if (reactions.length === 0) return null;

	return (
		<div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
			<div className="relative mx-auto h-full w-[calc(100%-80px)]">
				{reactions.map((reaction) => (
					<div
						className="absolute bottom-24 -translate-x-1/2 animate-reaction-float"
						key={reaction.id}
						style={{ left: `${reaction.x}%` }}
					>
						<div className="flex flex-col items-center gap-y-2">
							<span className="text-2xl">{reaction.emoji}</span>
							<p className="whitespace-nowrap rounded-full bg-black/60 px-8 py-2 text-white text-xs">
								{getDisplayName(reaction.playerName)}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
