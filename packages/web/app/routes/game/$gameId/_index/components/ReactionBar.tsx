import { REACTION_EMOJIS, type ReactionEmoji } from "@repo/db/models";
import classNames from "classnames";
import { useRef, useState } from "react";
import { Tile } from "~/components/Tile";

/** リアクション送信間隔の制限 (ミリ秒) */
const RATE_LIMIT_MS = 300;

/**
 * リアクション送信パネル
 */
export function ReactionBar({
	sendReaction,
	visible,
}: {
	sendReaction: (emoji: ReactionEmoji) => Promise<void>;
	visible: boolean;
}) {
	const lastSentAtRef = useRef(0);
	const [open, setOpen] = useState(false);

	const handleClick = (emoji: ReactionEmoji): void => {
		const now = Date.now();
		if (now - lastSentAtRef.current < RATE_LIMIT_MS) return;
		lastSentAtRef.current = now;
		void sendReaction(emoji);
	};

	return (
		<div
			className={classNames(
				"transition-opacity duration-300 ease-out",
				visible ? "opacity-100" : "pointer-events-none opacity-0",
			)}
			inert={!visible}
		>
			<div className="relative">
				<Tile
					aria-expanded={open}
					aria-label={
						open ? "リアクションパネルを閉じる" : "リアクションパネルを開く"
					}
					as="button"
					className="relative z-10 flex size-36 shrink-0 items-center justify-center rounded-full text-lg backdrop-blur-sm"
					onClick={() => setOpen((prev) => !prev)}
					thickness="amber"
				>
					<span aria-hidden="true">{open ? "×" : "😀"}</span>
				</Tile>

				<div
					className={classNames(
						"absolute right-2 bottom-full mb-8 flex origin-bottom flex-col gap-y-4 rounded-full border border-cream-200 bg-cream-50/95 py-8 shadow-tile-drop backdrop-blur-sm transition-all duration-200 ease-out",
						open
							? "scale-y-100 opacity-100"
							: "pointer-events-none scale-y-0 opacity-0",
					)}
					inert={!open}
				>
					{REACTION_EMOJIS.map((emoji) => (
						<button
							aria-label={`${emoji}のリアクションを送る`}
							className="rounded-full p-4 text-lg transition-transform active:scale-125"
							key={emoji}
							onClick={() => handleClick(emoji)}
							type="button"
						>
							<span aria-hidden="true">{emoji}</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
