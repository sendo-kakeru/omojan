import type { GameResultResponseBody } from "@repo/db/models";
import type { PlayerId, UserId } from "@repo/db/schemas";
import { MOCK_ME } from "@repo/mock/model";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GameFinalResult } from "./GameFinalResult";
import { GameResultSkeleton } from "./GameResultSkeleton";

const PLAYER_1 = "player_1" as PlayerId;
const PLAYER_2 = "player_2" as PlayerId;
const PLAYER_3 = "player_3" as PlayerId;
const PLAYER_4 = "player_4" as PlayerId;

const USER_2 = "00000000-0000-0000-0000-0000000000a2" as UserId;
const USER_3 = "00000000-0000-0000-0000-0000000000a3" as UserId;
const USER_4 = "00000000-0000-0000-0000-0000000000a4" as UserId;

const mockResult: GameResultResponseBody = {
	rounds: [
		{
			players: [
				{
					id: PLAYER_1,
					image: null,
					isWinner: true,
					playerName: "プレイヤー1",
					submission: "激辛カレー",
					userId: MOCK_ME.userId,
				},
				{
					id: PLAYER_2,
					image: null,
					isWinner: false,
					playerName: "プレイヤー2",
					submission: "カレーうどん",
					userId: USER_2,
				},
				{
					id: PLAYER_3,
					image: null,
					isWinner: false,
					playerName: "プレイヤー3",
					submission: "おふくろカレー",
					userId: USER_3,
				},
				{
					id: PLAYER_4,
					image: null,
					isWinner: false,
					playerName: "プレイヤー4",
					submission: "カレーパン",
					userId: USER_4,
				},
			],
			roundNo: 1,
			theme: "カレー",
		},
		{
			players: [
				{
					id: PLAYER_1,
					image: null,
					isWinner: false,
					playerName: "プレイヤー1",
					submission: "ラーメン二郎",
					userId: MOCK_ME.userId,
				},
				{
					id: PLAYER_2,
					image: null,
					isWinner: true,
					playerName: "プレイヤー2",
					submission: "背脂ラーメン",
					userId: USER_2,
				},
				{
					id: PLAYER_3,
					image: null,
					isWinner: false,
					playerName: "プレイヤー3",
					submission: "ラーメン屋",
					userId: USER_3,
				},
				{
					id: PLAYER_4,
					image: null,
					isWinner: false,
					playerName: "プレイヤー4",
					submission: "冷やしラーメン",
					userId: USER_4,
				},
			],
			roundNo: 2,
			theme: "ラーメン",
		},
		{
			players: [
				{
					id: PLAYER_1,
					image: null,
					isWinner: false,
					playerName: "プレイヤー1",
					submission: "回る寿司",
					userId: MOCK_ME.userId,
				},
				{
					id: PLAYER_2,
					image: null,
					isWinner: false,
					playerName: "プレイヤー2",
					submission: "寿司打ち",
					userId: USER_2,
				},
				{
					id: PLAYER_3,
					image: null,
					isWinner: true,
					playerName: "プレイヤー3",
					submission: "大トロ寿司",
					userId: USER_3,
				},
				{
					id: PLAYER_4,
					image: null,
					isWinner: false,
					playerName: "プレイヤー4",
					submission: "寿司詰め合わせ",
					userId: USER_4,
				},
			],
			roundNo: 3,
			theme: "寿司",
		},
		{
			players: [
				{
					id: PLAYER_1,
					image: null,
					isWinner: true,
					playerName: "プレイヤー1",
					submission: "宇都宮餃子",
					userId: MOCK_ME.userId,
				},
				{
					id: PLAYER_2,
					image: null,
					isWinner: false,
					playerName: "プレイヤー2",
					submission: "餃子の皮",
					userId: USER_2,
				},
				{
					id: PLAYER_3,
					image: null,
					isWinner: false,
					playerName: "プレイヤー3",
					submission: "羽根つき餃子",
					userId: USER_3,
				},
				{
					id: PLAYER_4,
					image: null,
					isWinner: false,
					playerName: "プレイヤー4",
					submission: "餃子パーティー",
					userId: USER_4,
				},
			],
			roundNo: 4,
			theme: "餃子",
		},
	],
	title: "テストゲーム",
	winners: [
		{
			id: PLAYER_1,
			image: null,
			playerName: "プレイヤー1",
			userId: MOCK_ME.userId,
			winCount: 2,
		},
	],
};

const meta: Meta<typeof GameFinalResult> = {
	component: GameFinalResult,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GameFinalResult",
};

export default meta;
type Story = StoryObj<typeof GameFinalResult>;

// 自分が優勝
export const MeAsWinner: Story = {
	args: {
		result: mockResult,
	},
	name: "自分が優勝",
	parameters: { authed: true },
};

// 他のプレイヤーが優勝
export const OtherPlayerWinner: Story = {
	args: {
		result: mockResult,
	},
	name: "他のプレイヤーが優勝",
};

// 同率優勝（複数人）
export const TiedWinners: Story = {
	args: {
		result: {
			...mockResult,
			winners: [
				{
					id: PLAYER_1,
					image: null,
					playerName: "プレイヤー1",
					userId: MOCK_ME.userId,
					winCount: 2,
				},
				{
					id: PLAYER_2,
					image: null,
					playerName: "プレイヤー2",
					userId: USER_2,
					winCount: 2,
				},
			],
		},
	},
	name: "同率優勝（複数人）",
	parameters: { authed: true },
};

// 全員1勝ずつ
export const AllTied: Story = {
	args: {
		result: {
			...mockResult,
			winners: [
				{
					id: PLAYER_1,
					image: null,
					playerName: "プレイヤー1",
					userId: MOCK_ME.userId,
					winCount: 1,
				},
				{
					id: PLAYER_2,
					image: null,
					playerName: "プレイヤー2",
					userId: USER_2,
					winCount: 1,
				},
				{
					id: PLAYER_3,
					image: null,
					playerName: "プレイヤー3",
					userId: USER_3,
					winCount: 1,
				},
				{
					id: PLAYER_4,
					image: null,
					playerName: "プレイヤー4",
					userId: USER_4,
					winCount: 1,
				},
			],
		},
	},
	name: "全員1勝ずつ（4人優勝）",
	parameters: { authed: true },
};

// 長い名前とワード
export const LongNamesAndWords: Story = {
	args: {
		result: {
			rounds: [
				{
					players: [
						{
							id: PLAYER_1,
							image: null,
							isWinner: true,
							playerName: "とても長い名前のプレイヤー1",
							submission: "ジャーナリズムのかけらもないプログラミング",
							userId: null,
						},
						{
							id: PLAYER_2,
							image: null,
							isWinner: false,
							playerName: "プレイヤー2",
							submission: "プログラミングよそはよそうちは",
							userId: null,
						},
						{
							id: PLAYER_3,
							image: null,
							isWinner: false,
							playerName: "名前がめちゃくちゃ長いプレイヤー",
							submission: "思いもよらぬプログラミング",
							userId: null,
						},
						{
							id: PLAYER_4,
							image: null,
							isWinner: false,
							playerName: "プレイヤー4",
							submission: "プログラミング生麦生米",
							userId: null,
						},
					],
					roundNo: 1,
					theme: "プログラミング",
				},
				{
					players: [
						{
							id: PLAYER_1,
							image: null,
							isWinner: true,
							playerName: "とても長い名前のプレイヤー1",
							submission: "超高性能コンピューター",
							userId: null,
						},
						{
							id: PLAYER_2,
							image: null,
							isWinner: false,
							playerName: "プレイヤー2",
							submission: "コンピューターウイルス",
							userId: null,
						},
						{
							id: PLAYER_3,
							image: null,
							isWinner: false,
							playerName: "名前がめちゃくちゃ長いプレイヤー",
							submission: "量子コンピューター",
							userId: null,
						},
						{
							id: PLAYER_4,
							image: null,
							isWinner: false,
							playerName: "プレイヤー4",
							submission: "コンピューターおばあちゃん",
							userId: null,
						},
					],
					roundNo: 2,
					theme: "コンピューター",
				},
				{
					players: [
						{
							id: PLAYER_1,
							image: null,
							isWinner: true,
							playerName: "とても長い名前のプレイヤー1",
							submission: "神ゲーム",
							userId: null,
						},
						{
							id: PLAYER_2,
							image: null,
							isWinner: false,
							playerName: "プレイヤー2",
							submission: "ゲームオーバー",
							userId: null,
						},
						{
							id: PLAYER_3,
							image: null,
							isWinner: false,
							playerName: "名前がめちゃくちゃ長いプレイヤー",
							submission: "クソゲーム",
							userId: null,
						},
						{
							id: PLAYER_4,
							image: null,
							isWinner: false,
							playerName: "プレイヤー4",
							submission: "ゲームセンター",
							userId: null,
						},
					],
					roundNo: 3,
					theme: "ゲーム",
				},
				{
					players: [
						{
							id: PLAYER_1,
							image: null,
							isWinner: false,
							playerName: "とても長い名前のプレイヤー1",
							submission: "闇インターネット",
							userId: null,
						},
						{
							id: PLAYER_2,
							image: null,
							isWinner: true,
							playerName: "プレイヤー2",
							submission: "インターネット老人",
							userId: null,
						},
						{
							id: PLAYER_3,
							image: null,
							isWinner: false,
							playerName: "名前がめちゃくちゃ長いプレイヤー",
							submission: "無限インターネット",
							userId: null,
						},
						{
							id: PLAYER_4,
							image: null,
							isWinner: false,
							playerName: "プレイヤー4",
							submission: "インターネットカフェ",
							userId: null,
						},
					],
					roundNo: 4,
					theme: "インターネット",
				},
			],
			title: "長い名前テスト",
			winners: [
				{
					id: PLAYER_1,
					image: null,
					playerName: "とても長い名前のプレイヤー1",
					userId: MOCK_ME.userId,
					winCount: 3,
				},
			],
		},
	},
	name: "長い名前とワード",
	parameters: { authed: true },
};

// 勝者なし（全ラウンドで誰も票を得なかった）
export const NoWinner: Story = {
	args: {
		result: {
			...mockResult,
			rounds: mockResult.rounds.map((round) => ({
				...round,
				players: round.players.map((player) => ({
					...player,
					isWinner: false,
				})),
			})),
			winners: [],
		},
	},
	name: "勝者なし",
	parameters: { authed: true },
};

// 自分が負け（未ログイン状態）
export const MeAsLoser: Story = {
	args: {
		result: {
			...mockResult,
			winners: [
				{
					id: PLAYER_1,
					image: null,
					playerName: "プレイヤー1",
					userId: USER_2,
					winCount: 3,
				},
			],
		},
	},
	name: "自分が負け",
};

// スケルトン
export const Skeleton: StoryObj<typeof GameResultSkeleton> = {
	name: "スケルトン",
	render: () => <GameResultSkeleton />,
};
