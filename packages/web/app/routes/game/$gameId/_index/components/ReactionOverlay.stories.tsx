import { REACTION_EMOJIS } from "@repo/db/model";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import type { Reaction } from "../hooks/useReactions";
import { ReactionOverlay } from "./ReactionOverlay";

const meta: Meta<typeof ReactionOverlay> = {
	component: ReactionOverlay,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/ReactionOverlay",
};

export default meta;
type Story = StoryObj<typeof ReactionOverlay>;

const createReaction = ({
	emoji,
	playerName,
	x,
}: {
	emoji: (typeof REACTION_EMOJIS)[number];
	playerName: string;
	x: number;
}): Reaction => ({
	emoji,
	id: crypto.randomUUID(),
	playerName,
	type: "REACTION",
	x,
});

export const Default: Story = {
	args: {
		reactions: [
			createReaction({ emoji: "😂", playerName: "たろう", x: 20 }),
			createReaction({ emoji: "🔥", playerName: "はなこ", x: 50 }),
			createReaction({ emoji: "👏", playerName: "じろう", x: 80 }),
		],
	},
	name: "リアクション表示",
};

export const Many: Story = {
	args: {
		reactions: REACTION_EMOJIS.map((emoji, i) =>
			createReaction({
				emoji,
				playerName: `プレイヤー${i + 1}`,
				x: 10 + i * 15,
			}),
		),
	},
	name: "大量リアクション",
};

export const LongName: Story = {
	args: {
		reactions: [
			createReaction({
				emoji: "🫠",
				playerName: "とてもながいなまえのぷれいやー",
				x: 0,
			}),
			createReaction({
				emoji: "🫠",
				playerName: "とてもながいなまえのぷれいやー",
				x: 100,
			}),
		],
	},
	name: "長いプレイヤー名",
};

export const Empty: Story = {
	args: {
		reactions: [],
	},
	name: "リアクションなし",
};
