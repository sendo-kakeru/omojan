import type { PlayerCardId } from "@repo/db/schemas";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { gameScreenParameters } from "~/storybook/decorators";
import { PlayerCardDisplay } from "./PlayerCardDisplay";
import { ReactionBar } from "./ReactionBar";

const noopReaction = async () => {};

const createPlayerCardId = (id: string): PlayerCardId =>
	`card_${id}` as PlayerCardId;

const mockCards = [
	{ id: createPlayerCardId("1"), used: false, word: "激辛" },
	{ id: createPlayerCardId("2"), used: false, word: "究極" },
	{ id: createPlayerCardId("3"), used: false, word: "おふくろ" },
	{ id: createPlayerCardId("4"), used: false, word: "禁断" },
	{ id: createPlayerCardId("5"), used: false, word: "最強" },
	{ id: createPlayerCardId("6"), used: false, word: "伝説" },
	{ id: createPlayerCardId("7"), used: false, word: "秘密" },
];

const mockCardsWithUsed = [
	{ id: createPlayerCardId("1"), used: true, word: "激辛" },
	{ id: createPlayerCardId("2"), used: true, word: "究極" },
	{ id: createPlayerCardId("3"), used: false, word: "おふくろ" },
	{ id: createPlayerCardId("4"), used: false, word: "禁断" },
	{ id: createPlayerCardId("5"), used: false, word: "最強" },
	{ id: createPlayerCardId("6"), used: false, word: "伝説" },
	{ id: createPlayerCardId("7"), used: false, word: "秘密" },
];

const meta: Meta<typeof PlayerCardDisplay> = {
	component: PlayerCardDisplay,
	decorators: [
		(Story) => (
			<div className="grid min-h-svh place-items-center bg-table px-16 font-sans text-neutral-800">
				<Story />
			</div>
		),
	],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/PlayerCardDisplay",
};

export default meta;
type Story = StoryObj<typeof PlayerCardDisplay>;

// 基本表示（非操作可能）
export const Default: Story = {
	args: {
		cards: mockCards,
	},
	name: "基本表示",
};

// 使用済みカードあり
export const WithUsedCards: Story = {
	args: {
		cards: mockCardsWithUsed,
	},
	name: "使用済みカードあり",
};

// インタラクティブ（選択可能）
export const Interactive: Story = {
	name: "選択可能",
	render: () => {
		const [selectedCardId, setSelectedCardId] = useState<PlayerCardId | null>(
			null,
		);

		return (
			<div className="grid gap-y-16">
				<p className="text-sm text-neutral-600">
					選択中: {selectedCardId ?? "なし"}
				</p>
				<PlayerCardDisplay
					cards={mockCardsWithUsed}
					onCardClick={(cardId) => setSelectedCardId(cardId)}
					selectedCardId={selectedCardId}
				/>
			</div>
		);
	},
};

// 確定済み状態
export const Confirmed: Story = {
	args: {
		cards: mockCardsWithUsed,
		isConfirmed: true,
		onCardClick: () => {},
		selectedCardId: createPlayerCardId("3"),
	},
	name: "確定済み状態",
};

// リアクションパネル付き
export const WithReactionBar: Story = {
	args: {
		cards: mockCards,
		reactionBar: <ReactionBar sendReaction={noopReaction} visible={true} />,
	},
	name: "リアクションパネル付き",
};

// 長い単語
export const LongWords: Story = {
	args: {
		cards: [
			{
				id: createPlayerCardId("1"),
				used: false,
				word: "ジャーナリズムのかけらもない",
			},
			{
				id: createPlayerCardId("2"),
				used: false,
				word: "よそはよそうちはうち",
			},
			{ id: createPlayerCardId("3"), used: true, word: "思いもよらぬ" },
			{ id: createPlayerCardId("4"), used: false, word: "生麦生米生卵" },
			{ id: createPlayerCardId("5"), used: false, word: "ピタゴラスイッチ" },
		],
	},
	name: "長い単語",
};
