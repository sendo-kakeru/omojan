import type { GameServerResultMessage } from "@repo/db/model";
import type { PlayerCardId, PlayerId, PlayerSeat } from "@repo/db/schema";
import type { Meta, StoryObj } from "@storybook/react-vite";
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
		seat: 1 as PlayerSeat,
		submission: { position: "prefix" as const, text: "激辛" },
		winCount: 1,
	},
	{
		id: createPlayerId("2"),
		image: null,
		playerName: "プレイヤー2",
		seat: 2 as PlayerSeat,
		submission: { position: "suffix" as const, text: "究極" },
		winCount: 0,
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
	decorators: [
		(Story) => (
			<div className="h-screen w-full bg-gray-100 p-16">
				<Story />
			</div>
		),
	],
	parameters: {
		layout: "fullscreen",
	},
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

// 長い組み合わせ
export const LongCombinations: Story = {
	args: {
		data: {
			game: {
				...baseGameData,
				players: [
					{
						...mockPlayersWithSubmissions[0]!,
						submission: {
							position: "prefix" as const,
							text: "ジャーナリズムのかけらもない",
						},
					},
					{
						...mockPlayersWithSubmissions[1]!,
						submission: {
							position: "suffix" as const,
							text: "よそはよそうちは",
						},
					},
					{
						...mockPlayersWithSubmissions[2]!,
						submission: { position: "prefix" as const, text: "思いもよらぬ" },
					},
					{
						...mockPlayersWithSubmissions[3]!,
						submission: { position: "suffix" as const, text: "生麦生米" },
					},
				],
				theme: "プログラミング",
				winnerPlayerIds: [createPlayerId("1")],
			},
			mePlayer: baseMePlayer,
			type: "RESULT",
		} satisfies GameServerResultMessage,
	},
	name: "長い組み合わせ",
};
