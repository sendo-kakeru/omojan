import type {
	GameServerRoundStartMessage,
	GameServerSubmissionMessage,
	GameServerTurnEndMessage,
	GameServerTurnStartMessage,
} from "@repo/db/model";
import type { PlayerCardId, PlayerId, PlayerSeat } from "@repo/db/schema";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameSubmission } from "./GameSubmission";

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

// モックデータ生成ヘルパー
const createPlayerId = (id: string): PlayerId => `player_${id}` as PlayerId;
const createPlayerCardId = (id: string): PlayerCardId =>
	`card_${id}` as PlayerCardId;

const mockPlayers = [
	{
		id: createPlayerId("1"),
		image: null,
		playerName: "プレイヤー1",
		seat: 1 as PlayerSeat,
		submission: null,
		winCount: 0,
	},
	{
		id: createPlayerId("2"),
		image: null,
		playerName: "プレイヤー2",
		seat: 2 as PlayerSeat,
		submission: null,
		winCount: 1,
	},
	{
		id: createPlayerId("3"),
		image: null,
		playerName: "プレイヤー3",
		seat: 3 as PlayerSeat,
		submission: null,
		winCount: 0,
	},
	{
		id: createPlayerId("4"),
		image: null,
		playerName: "プレイヤー4",
		seat: 4 as PlayerSeat,
		submission: null,
		winCount: 2,
	},
];

const mockPlayerCards = [
	{ id: createPlayerCardId("1"), used: false, word: "激辛" },
	{ id: createPlayerCardId("2"), used: false, word: "究極" },
	{ id: createPlayerCardId("3"), used: false, word: "おふくろ" },
	{ id: createPlayerCardId("4"), used: false, word: "禁断" },
	{ id: createPlayerCardId("5"), used: true, word: "最強" },
	{ id: createPlayerCardId("6"), used: false, word: "伝説" },
	{ id: createPlayerCardId("7"), used: false, word: "秘密" },
];

const baseGameData = {
	players: mockPlayers,
	roundNo: 1 as const,
	theme: "カレー",
	timeLimit: 30,
};

const baseMePlayer = {
	id: createPlayerId("1"),
	playerCards: mockPlayerCards,
};

const meta: Meta<typeof GameSubmission> = {
	component: GameSubmission,
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
	title: "Game/GameSubmission",
};

export default meta;
type Story = StoryObj<typeof GameSubmission>;

// ラウンド開始時（オーバーレイ表示）
export const RoundStart: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("1"),
			game: {
				...baseGameData,
				submitted: null,
			},
			mePlayer: baseMePlayer,
			type: "ROUND_START",
		} satisfies GameServerRoundStartMessage,
		sendSubmission: noop,
	},
	name: "ラウンド開始（オーバーレイ表示）",
};

// 自分のターン開始
export const MyTurnStart: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("1"),
			game: {
				...baseGameData,
				submitted: null,
			},
			mePlayer: baseMePlayer,
			type: "TURN_START",
		} satisfies GameServerTurnStartMessage,
		sendSubmission: noop,
	},
	name: "自分のターン開始",
};

// 他プレイヤーのターン
export const OtherPlayerTurn: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("2"),
			game: {
				...baseGameData,
				submitted: null,
			},
			mePlayer: baseMePlayer,
			type: "TURN_START",
		} satisfies GameServerTurnStartMessage,
		sendSubmission: noop,
	},
	name: "他プレイヤーのターン",
};

// 他プレイヤーが提出完了（TURN_END）
export const OtherPlayerSubmitted: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("2"),
			game: {
				...baseGameData,
				players: mockPlayers.map((p) =>
					p.id === createPlayerId("2")
						? {
								...p,
								submission: { position: "prefix" as const, text: "激辛" },
							}
						: p,
				),
				submitted: { position: "prefix" as const, text: "激辛" },
			},
			mePlayer: baseMePlayer,
			type: "TURN_END",
		} satisfies GameServerTurnEndMessage,
		sendSubmission: noop,
	},
	name: "他プレイヤーが提出完了",
};

// ラウンド2以降
export const Round2: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("1"),
			game: {
				...baseGameData,
				roundNo: 2 as const,
				submitted: null,
				theme: "ラーメン",
			},
			mePlayer: {
				...baseMePlayer,
				playerCards: mockPlayerCards.map((c, i) =>
					i < 2 ? { ...c, used: true } : c,
				),
			},
			type: "TURN_START",
		} satisfies GameServerTurnStartMessage,
		sendSubmission: noop,
	},
	name: "ラウンド2（使用済みカードあり）",
};

// 勝利数表示
export const WithWinCounts: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("1"),
			game: {
				...baseGameData,
				players: mockPlayers.map((p, i) => ({
					...p,
					winCount: [2, 1, 0, 3][i] ?? 0,
				})),
				submitted: null,
			},
			mePlayer: baseMePlayer,
			type: "TURN_START",
		} satisfies GameServerTurnStartMessage,
		sendSubmission: noop,
	},
	name: "勝利数表示",
};

// 全状態一覧
export const AllStates: Story = {
	name: "全状態一覧",
	render: () => {
		const states: Array<{
			data: GameServerSubmissionMessage;
			label: string;
		}> = [
			{
				data: {
					currentPlayerId: createPlayerId("1"),
					game: { ...baseGameData, submitted: null },
					mePlayer: baseMePlayer,
					type: "ROUND_START",
				},
				label: "ラウンド開始",
			},
			{
				data: {
					currentPlayerId: createPlayerId("1"),
					game: { ...baseGameData, submitted: null },
					mePlayer: baseMePlayer,
					type: "TURN_START",
				},
				label: "自分のターン",
			},
			{
				data: {
					currentPlayerId: createPlayerId("2"),
					game: { ...baseGameData, submitted: null },
					mePlayer: baseMePlayer,
					type: "TURN_START",
				},
				label: "他プレイヤーのターン",
			},
			{
				data: {
					currentPlayerId: createPlayerId("2"),
					game: {
						...baseGameData,
						players: mockPlayers.map((p) =>
							p.id === createPlayerId("2")
								? {
										...p,
										submission: { position: "suffix" as const, text: "禁断" },
									}
								: p,
						),
						submitted: { position: "suffix" as const, text: "禁断" },
					},
					mePlayer: baseMePlayer,
					type: "TURN_END",
				},
				label: "他プレイヤー提出完了",
			},
		];

		return (
			<div className="grid gap-y-32">
				{states.map(({ data, label }) => (
					<div key={label}>
						<p className="mb-8 font-bold text-neutral-600 text-sm">{label}</p>
						<div className="h-600 rounded-lg border bg-gray-100 p-16">
							<GameSubmission data={data} sendSubmission={noop} />
						</div>
					</div>
				))}
			</div>
		);
	},
};
