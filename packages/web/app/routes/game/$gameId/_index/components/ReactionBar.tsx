import { REACTION_EMOJIS, type ReactionEmoji } from "@repo/db/model";
import classNames from "classnames";
import { useRef, useState } from "react";

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
	const [open, setOpen] = useState(true);

	const handleClick = (emoji: ReactionEmoji): void => {
		const now = Date.now();
		if (now - lastSentAtRef.current < RATE_LIMIT_MS) return;
		lastSentAtRef.current = now;
		void sendReaction(emoji);
	};

	return (
		<div
			className={classNames(
				"fixed right-16 bottom-16 z-40 flex items-end gap-x-8 transition-opacity duration-300 ease-out",
				visible ? "opacity-100" : "pointer-events-none opacity-0",
			)}
		>
			{/* 絵文字パネル（左方向に展開） */}
			<div
				className={classNames(
					"flex origin-right gap-x-4 rounded-full bg-white/90 px-8 shadow-lg backdrop-blur-sm transition-all duration-200 ease-out",
					open
						? "scale-x-100 opacity-100"
						: "pointer-events-none scale-x-0 opacity-0",
				)}
			>
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

			{/* トグルボタン */}
			<button
				className="flex size-36 shrink-0 items-center justify-center rounded-full bg-white/90 text-xl shadow-lg backdrop-blur-sm transition-transform active:scale-95"
				onClick={() => setOpen((prev) => !prev)}
				type="button"
			>
				{open ? "×" : "😀"}
			</button>
		</div>
	);
}
