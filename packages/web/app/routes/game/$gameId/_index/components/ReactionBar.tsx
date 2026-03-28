import { REACTION_EMOJIS, type ReactionEmoji } from "@repo/db/model";
import classNames from "classnames";
import { useRef } from "react";

/** リアクション送信間隔の制限 (ミリ秒) */
const RATE_LIMIT_MS = 300;

export function ReactionBar({
	sendReaction,
	visible,
}: {
	sendReaction: (emoji: ReactionEmoji) => Promise<void>;
	visible: boolean;
}) {
	const lastSentAtRef = useRef(0);

	const handleClick = (emoji: ReactionEmoji): void => {
		const now = Date.now();
		if (now - lastSentAtRef.current < RATE_LIMIT_MS) return;
		lastSentAtRef.current = now;
		void sendReaction(emoji);
	};

	return (
		<div
			className={classNames(
				"fixed bottom-8 left-1/2 z-40 -translate-x-1/2 transition-all duration-300 ease-out",
				visible
					? "translate-y-0 opacity-100"
					: "pointer-events-none translate-y-16 opacity-0",
			)}
		>
			<div className="flex gap-x-4 rounded-full bg-white/90 px-8 py-4 shadow-lg backdrop-blur-sm">
				{REACTION_EMOJIS.map((emoji) => (
					<button
						className="rounded-full p-4 text-xl transition-transform active:scale-125"
						key={emoji}
						onClick={() => handleClick(emoji)}
						type="button"
					>
						{emoji}
					</button>
				))}
			</div>
		</div>
	);
}
