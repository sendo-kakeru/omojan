import type {
	GameServerRoundStartMessage,
	GameServerSubmissionMessage,
	GameServerTurnEndMessage,
	GameServerTurnStartMessage,
} from "@repo/db/models";
import type { PlayerCardId, PlayerId } from "@repo/db/schemas";
import { ROUND_START_DISPLAY_MS } from "@repo/shared/constants/game";
import { WORDS } from "@repo/shared/constants/words";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GameSubmission } from "./GameSubmission";

const noop = async () => {};

// モックデータ生成ヘルパー
const createPlayerId = (id: string): PlayerId => `player_${id}` as PlayerId;
const createPlayerCardId = (id: string): PlayerCardId =>
	`card_${id}` as PlayerCardId;

const mockPlayers = [
	{
		id: createPlayerId("1"),
		image: null,
		playerName: "プレイヤー1",
		submission: null,
		winCount: 0,
	},
	{
		id: createPlayerId("2"),
		image: null,
		playerName: "プレイヤー2",
		submission: null,
		winCount: 1,
	},
	{
		id: createPlayerId("3"),
		image: null,
		playerName: "プレイヤー3",
		submission: null,
		winCount: 0,
	},
	{
		id: createPlayerId("4"),
		image: null,
		playerName: "プレイヤー4",
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
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GameSubmission",
};

export default meta;
type Story = StoryObj<typeof GameSubmission>;

// ラウンド1開始時（ラウンドバナー表示）
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
	name: "ラウンド1開始（ラウンドバナー）",
};

// ラウンド3開始時（ラウンドバナー表示）
export const Round3Start: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("3"),
			game: {
				...baseGameData,
				roundNo: 3 as const,
				submitted: null,
				theme: "お寿司",
			},
			mePlayer: {
				...baseMePlayer,
				playerCards: mockPlayerCards.map((c, i) =>
					i < 3 ? { ...c, used: true } : c,
				),
			},
			type: "ROUND_START",
		} satisfies GameServerRoundStartMessage,
		sendSubmission: noop,
	},
	name: "ラウンド3開始（ラウンドバナー）",
};

// ラウンド4開始時（ラウンドバナー表示・長いテーマ）
export const Round4StartLongTheme: Story = {
	args: {
		data: {
			currentPlayerId: createPlayerId("4"),
			game: {
				...baseGameData,
				roundNo: 4 as const,
				submitted: null,
				theme: "母さんが夜なべをして",
			},
			mePlayer: {
				...baseMePlayer,
				playerCards: mockPlayerCards.map((c, i) =>
					i < 4 ? { ...c, used: true } : c,
				),
			},
			type: "ROUND_START",
		} satisfies GameServerRoundStartMessage,
		sendSubmission: noop,
	},
	name: "ラウンド4開始（長いテーマ）",
};

/** 自分の番のプレビューを表示する時間(ms) */
const MY_TURN_PREVIEW_MS = 4_000 as const;

function RoundStartAndMyTurnSequence({
	startsWith,
}: {
	startsWith: "roundStart" | "myTurn";
}) {
	const [isStarting, setIsStarting] = useState(startsWith === "roundStart");

	useEffect(() => {
		const timer = setTimeout(
			() => setIsStarting((prev) => !prev),
			isStarting ? ROUND_START_DISPLAY_MS : MY_TURN_PREVIEW_MS,
		);
		return () => clearTimeout(timer);
	}, [isStarting]);

	const base = {
		currentPlayerId: createPlayerId("1"),
		game: { ...baseGameData, submitted: null },
		mePlayer: baseMePlayer,
	};
	const data: GameServerSubmissionMessage = isStarting
		? { ...base, type: "ROUND_START" }
		: { ...base, type: "TURN_START" };

	return <GameSubmission data={data} sendSubmission={noop} />;
}

export const RoundStartToMyTurn: Story = {
	name: "ラウンド開始→自分の番",
	render: () => <RoundStartAndMyTurnSequence startsWith="roundStart" />,
};

export const MyTurnToRoundStart: Story = {
	name: "自分の番→ラウンド開始（再接続）",
	render: () => <RoundStartAndMyTurnSequence startsWith="myTurn" />,
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

// ラウンド3の自分のターン（3番目のプレイヤー、上位2人は提出済み・ランダム単語）
export const Round3MyTurn: Story = {
	name: "ラウンド3（自分のターン・単語ランダム）",
	render: () => {
		const enabledWords = WORDS.filter((w) => w.enabled);
		const shuffled = [...enabledWords].sort(() => Math.random() - 0.5);

		// テーマ用に1つ、提出済み2人分に2つ、手札用に7つ選ぶ
		const selected = shuffled.slice(0, 10);
		const themeWord = selected[0]?.text ?? "カレー";
		const sub1Word = selected[1]?.text ?? "激辛";
		const sub2Word = selected[2]?.text ?? "伝説";
		const handWords = selected.slice(3);

		const randomPosition = () =>
			Math.random() > 0.5 ? ("prefix" as const) : ("suffix" as const);

		const players = mockPlayers.map((p) => {
			if (p.id === createPlayerId("1")) {
				return {
					...p,
					submission: { position: randomPosition(), text: sub1Word },
				};
			}
			if (p.id === createPlayerId("2")) {
				return {
					...p,
					submission: { position: randomPosition(), text: sub2Word },
				};
			}
			return p;
		});

		const playerCards = handWords.slice(0, 7).map((w, i) => ({
			id: createPlayerCardId(String(i + 1)),
			used: i < 2,
			word: w.text,
		}));

		return (
			<GameSubmission
				data={{
					currentPlayerId: createPlayerId("3"),
					game: {
						...baseGameData,
						players,
						roundNo: 3 as const,
						submitted: null,
						theme: themeWord,
					},
					mePlayer: {
						id: createPlayerId("3"),
						playerCards,
					},
					type: "TURN_START",
				}}
				sendSubmission={noop}
			/>
		);
	},
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
						<p className="mb-8 text-sm font-bold text-neutral-600">{label}</p>
						<div className="h-600 overflow-x-hidden rounded-lg border bg-yellow-50">
							<div className="mx-auto grid h-full max-w-800 px-16">
								<div>
									<GameSubmission data={data} sendSubmission={noop} />
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		);
	},
};
