import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import type { UserId } from "@repo/db/schema";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { RoomCard } from "./RoomCard";
import { RoomCardSkeleton } from "./RoomCardSkeleton";

const meta: Meta = {
	component: RoomCard,
	decorators: [
		(Story) => (
			<div className="grid">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Room/RoomCard",
};

export default meta;
type Story = StoryFn<typeof RoomCard>;

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

const createWaitingRoom = (overrides?: Partial<WaitingRoom>): WaitingRoom => ({
	createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前
	gameId: "game-123" as WaitingRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as WaitingRoom["players"][0]["id"],
			image: null,
			playerName: "ホスト",
			seat: 1,
			userId: DUMMY_USER_ID,
		},
	],
	timeLimit: 60,
	title: "楽しいお絵描き部屋",
	...overrides,
});

const createFinishedRoom = (
	overrides?: Partial<FinishedRoom>,
): FinishedRoom => ({
	finishedAt: new Date(2024, 0, 15).toISOString(), // 2024/01/15
	gameId: "game-123" as FinishedRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: true,
			playerName: "プレイヤー1",
			seat: 1,
			userId: DUMMY_USER_ID,
		},
		{
			id: "player-2" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー2",
			seat: 2,
			userId: null,
		},
		{
			id: "player-3" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー3",
			seat: 3,
			userId: null,
		},
		{
			id: "player-4" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー4",
			seat: 4,
			userId: null,
		},
	],
	timeLimit: 60,
	title: "終了した部屋",
	...overrides,
});

/** 募集中: 基本 */
export const WaitingDefault: Story = () => (
	<RoomCard room={createWaitingRoom()} status="waiting" />
);

/** 募集中: プライベート */
export const WaitingPrivate: Story = () => (
	<RoomCard room={createWaitingRoom({ isPrivate: true })} status="waiting" />
);

/** 募集中: 2人参加 */
export const WaitingTwoPlayers: Story = () => (
	<RoomCard
		room={createWaitingRoom({
			players: [
				{
					id: "player-1" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "ホスト",
					seat: 1,
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "参加者A",
					seat: 2,
					userId: null,
				},
			],
		})}
		status="waiting"
	/>
);

/** 募集中: 満員 */
export const WaitingFullRoom: Story = () => (
	<RoomCard
		room={createWaitingRoom({
			players: [
				{
					id: "player-1" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "ホスト",
					seat: 1,
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "参加者A",
					seat: 2,
					userId: null,
				},
				{
					id: "player-3" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "参加者B",
					seat: 3,
					userId: null,
				},
				{
					id: "player-4" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "参加者C",
					seat: 4,
					userId: null,
				},
			],
			title: "満員の部屋",
		})}
		status="waiting"
	/>
);

/** 終了済み: 基本 */
export const FinishedDefault: Story = () => (
	<RoomCard room={createFinishedRoom()} status="finished" />
);

/** 終了済み: プライベート */
export const FinishedPrivate: Story = () => (
	<RoomCard room={createFinishedRoom({ isPrivate: true })} status="finished" />
);

/** 終了済み: 複数優勝者 */
export const FinishedMultipleWinners: Story = () => (
	<RoomCard
		room={createFinishedRoom({
			players: [
				{
					id: "player-1" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: true,
					playerName: "優勝者A",
					seat: 1,
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: true,
					playerName: "優勝者B",
					seat: 2,
					userId: null,
				},
				{
					id: "player-3" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: false,
					playerName: "参加者C",
					seat: 3,
					userId: null,
				},
				{
					id: "player-4" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: false,
					playerName: "参加者D",
					seat: 4,
					userId: null,
				},
			],
			title: "同点優勝の部屋",
		})}
		status="finished"
	/>
);

/** 終了済み: 優勝者なし */
export const FinishedNoWinners: Story = () => (
	<RoomCard
		room={createFinishedRoom({
			players: [
				{
					id: "player-1" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: false,
					playerName: "プレイヤー1",
					seat: 1,
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as FinishedRoom["players"][0]["id"],
					image: null,
					isWinner: false,
					playerName: "プレイヤー2",
					seat: 2,
					userId: null,
				},
			],
			title: "引き分けの部屋",
		})}
		status="finished"
	/>
);

/** 長いタイトル */
export const LongTitle: Story = () => (
	<RoomCard
		room={createWaitingRoom({
			title: "とても長いタイトルの部屋名がここに入りますがどうなるでしょうか",
		})}
		status="waiting"
	/>
);

/** 長いプレイヤー名 */
export const LongPlayerNames: Story = () => (
	<RoomCard
		room={createWaitingRoom({
			players: [
				{
					id: "player-1" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "とても長いプレイヤー名のユーザー",
					seat: 1,
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as WaitingRoom["players"][0]["id"],
					image: null,
					playerName: "別の長い名前のプレイヤー",
					seat: 2,
					userId: null,
				},
			],
		})}
		status="waiting"
	/>
);

/** 制限時間バリエーション */
export const DifferentTimeLimits: Story = () => (
	<div className="flex flex-col gap-16">
		<RoomCard
			room={createWaitingRoom({ timeLimit: 15, title: "15秒部屋" })}
			status="waiting"
		/>
		<RoomCard
			room={createWaitingRoom({ timeLimit: 60, title: "60秒部屋" })}
			status="waiting"
		/>
		<RoomCard
			room={createWaitingRoom({ timeLimit: 180, title: "180秒部屋" })}
			status="waiting"
		/>
		<RoomCard
			room={createWaitingRoom({ timeLimit: 360, title: "360秒部屋" })}
			status="waiting"
		/>
	</div>
);

export const Loading: Story = () => <RoomCardSkeleton />;
