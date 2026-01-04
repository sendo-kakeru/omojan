import type { GameServerVoteMessage } from "@repo/db/model";
import type { PlayerCardId, PlayerId, PlayerSeat } from "@repo/db/schema";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GameVote } from "./GameVote";

// モックデータ生成ヘルパー
const createPlayerId = (id: string): PlayerId => `player_${id}` as PlayerId;
const createPlayerCardId = (id: string): PlayerCardId =>
	`card_${id}` as PlayerCardId;

const mockPlayersWithSubmissions = [
	{
		id: createPlayerId("1"),
		image: null,
		playerName: "プレイヤー1",
		seat: 1 as PlayerSeat,
		submission: { position: "prefix" as const, text: "激辛" },
		winCount: 0,
	},
	{
		id: createPlayerId("2"),
		image: null,
		playerName: "プレイヤー2",
		seat: 2 as PlayerSeat,
		submission: { position: "suffix" as const, text: "究極" },
		winCount: 1,
	},
	{
		id: createPlayerId("3"),
		image: null,
		playerName: "プレイヤー3",
		seat: 3 as PlayerSeat,
		submission: { position: "prefix" as const, text: "おふくろ" },
		winCount: 0,
	},
	{
		id: createPlayerId("4"),
		image: null,
		playerName: "プレイヤー4",
		seat: 4 as PlayerSeat,
		submission: { position: "suffix" as const, text: "禁断" },
		winCount: 2,
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
};

const baseMePlayer = {
	id: createPlayerId("1"),
	playerCards: mockPlayerCards,
};

const meta: Meta<typeof GameVote> = {
	component: GameVote,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GameVote",
};

export default meta;
type Story = StoryObj<typeof GameVote>;

// 投票画面（初期状態）
export const Default: Story = {
	args: {
		data: {
			game: baseGameData,
			mePlayer: baseMePlayer,
			type: "VOTE_START",
		} satisfies GameServerVoteMessage,
	},
	name: "投票画面（初期状態）",
};

// ラウンド2
export const Round2: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				roundNo: 2 as const,
				theme: "ラーメン",
			},
			mePlayer: {
				...baseMePlayer,
				playerCards: mockPlayerCards.map((c, i) =>
					i < 2 ? { ...c, used: true } : c,
				),
			},
			type: "VOTE_START",
		} satisfies GameServerVoteMessage,
	},
	name: "ラウンド2",
};

// 勝利数が様々なプレイヤー
export const WithVariousWinCounts: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: mockPlayersWithSubmissions.map((p, i) => ({
					...p,
					winCount: [2, 1, 0, 3][i] ?? 0,
				})),
			},
			mePlayer: baseMePlayer,
			type: "VOTE_START",
		} satisfies GameServerVoteMessage,
	},
	name: "勝利数が様々なプレイヤー",
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
				})),
				theme: "プログラミング",
			},
			mePlayer: baseMePlayer,
			type: "VOTE_START",
		} satisfies GameServerVoteMessage,
	},
	name: "長い組み合わせ",
};
