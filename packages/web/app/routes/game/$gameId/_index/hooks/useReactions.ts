import type { GameServerReactionMessage } from "@repo/db/models";
import { useState } from "react";

export type Reaction = GameServerReactionMessage & {
	id: string;
	/** 画面内のランダムな水平位置 (%) */
	x: number;
};

const REACTION_DURATION_MS = 3_000;
const MAX_REACTIONS = 20;

export function useReactions(): {
	addReaction: (reaction: GameServerReactionMessage) => void;
	reactions: Reaction[];
} {
	const [reactions, setReactions] = useState<Reaction[]>([]);

	const addReaction = (reaction: GameServerReactionMessage): void => {
		const id = crypto.randomUUID();
		const x = Math.random() * 100;

		setReactions((prev) => {
			const next = [...prev, { ...reaction, id, x }];
			// 溢れ防止
			if (next.length > MAX_REACTIONS) {
				return next.slice(-MAX_REACTIONS);
			}
			return next;
		});

		// アニメーション完了後に自動削除
		setTimeout(() => {
			setReactions((prev) => prev.filter((r) => r.id !== id));
		}, REACTION_DURATION_MS);
	};

	return { addReaction, reactions };
}
