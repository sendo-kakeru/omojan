import type { GameServerResultMessage } from "@repo/db/models";
import type { PlayerCardId, PlayerId } from "@repo/db/schemas";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GameResult } from "./GameResult";

// モックデータ生成ヘルパー
const createPlayerId = (id: string): PlayerId => `player_${id}` as PlayerId;
const createPlayerCardId = (id: string): PlayerCardId =>
	`card_${id}` as PlayerCardId;

const mockPlayersWithSubmissions = [
	{
		id: createPlayerId("1"),
		image: null,
		playerName: "プレイヤー1",
		submission: { position: "prefix" as const, text: "激辛" },
		voteCount: 2,
		winCount: 1,
	},
	{
		id: createPlayerId("2"),
		image: null,
		playerName: "プレイヤー2",
		submission: { position: "suffix" as const, text: "究極" },
		voteCount: 1,
		winCount: 0,
	},
	{
		id: createPlayerId("3"),
		image: null,
		playerName: "プレイヤー3",
		submission: { position: "prefix" as const, text: "おふくろ" },
		voteCount: 1,
		winCount: 0,
	},
	{
		id: createPlayerId("4"),
		image: null,
		playerName: "プレイヤー4",
		submission: { position: "suffix" as const, text: "禁断" },
		voteCount: 0,
		winCount: 0,
	},
];

const mockPlayerCards = [
	{ id: createPlayerCardId("1"), used: true, word: "激辛" },
	{ id: createPlayerCardId("2"), used: false, word: "究極" },
	{ id: createPlayerCardId("3"), used: false, word: "おふくろ" },
	{ id: createPlayerCardId("4"), used: false, word: "禁断" },
	{ id: createPlayerCardId("5"), used: false, word: "最強" },
	{ id: createPlayerCardId("6"), used: false, word: "伝説" },
	{ id: createPlayerCardId("7"), used: false, word: "秘密" },
];

const baseGameData = {
	players: mockPlayersWithSubmissions,
	roundNo: 1 as const,
	theme: "カレー",
	timeLimit: 30,
	winnerPlayerIds: [createPlayerId("1")],
};

const baseMePlayer = {
	id: createPlayerId("1"),
	playerCards: mockPlayerCards,
};

const meta: Meta<typeof GameResult> = {
	component: GameResult,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GameResult",
};

export default meta;
type Story = StoryObj<typeof GameResult>;

// 結果画面（自分が勝者）
export const Default: Story = {
	args: {
		data: {
			game: baseGameData,
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "結果画面（自分が勝者）",
};

// 他のプレイヤーが勝者
export const OtherPlayerWinner: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p, i) => ({
					...p,
					voteCount: [1, 2, 1, 0][i] ?? 0,
				})),
				winnerPlayerIds: [createPlayerId("2")],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "他のプレイヤーが勝者",
};

// 同率勝者（複数人）
export const MultipleWinners: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p, i) => ({
					...p,
					voteCount: [2, 1, 2, 0][i] ?? 0,
				})),
				winnerPlayerIds: [createPlayerId("1"), createPlayerId("3")],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "同率勝者（複数人）",
};

// ラウンド4（最終ラウンド）
export const Round4: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p, i) => ({
					...p,
					voteCount: [3, 0, 0, 1][i] ?? 0,
					winCount: [2, 1, 0, 1][i] ?? 0,
				})),
				roundNo: 4 as const,
				theme: "ラーメン",
				winnerPlayerIds: [createPlayerId("1")],
			},
			mePlayer: {
				...baseMePlayer,
				playerCards: mockPlayerCards.map((c, i) =>
					i < 4 ? { ...c, used: true } : c,
				),
			},
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "ラウンド4（最終ラウンド）",
};

// 勝利数が様々なプレイヤー
export const WithVariousWinCounts: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p, i) => ({
					...p,
					voteCount: [0, 1, 0, 3][i] ?? 0,
					winCount: [3, 1, 0, 2][i] ?? 0,
				})),
				roundNo: 4 as const,
				winnerPlayerIds: [createPlayerId("4")],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "勝利数が様々なプレイヤー",
};

// 全員勝者（4人勝ち）
export const AllWinners: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p) => ({
					...p,
					voteCount: 1,
					winCount: 1,
				})),
				winnerPlayerIds: [
					createPlayerId("1"),
					createPlayerId("2"),
					createPlayerId("3"),
					createPlayerId("4"),
				],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "全員勝者（4人勝ち）",
};

// 長い組み合わせ
export const LongCombinations: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((player, index) => ({
					...player,
					submission:
						[
							{
								position: "prefix" as const,
								text: "ジャーナリズムのかけらもない",
							},
							{ position: "suffix" as const, text: "よそはよそうちは" },
							{ position: "prefix" as const, text: "思いもよらぬ" },
							{ position: "suffix" as const, text: "生麦生米" },
						][index] ?? player.submission,
					voteCount: [2, 1, 1, 0][index] ?? 0,
				})),
				theme: "プログラミング",
				winnerPlayerIds: [createPlayerId("1")],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "長い組み合わせ",
};
