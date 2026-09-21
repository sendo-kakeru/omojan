import type { WaitingRoom } from "@repo/db/model";
import type { UserId } from "@repo/db/schema";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { WaitingRoomCard } from "./WaitingRoomCard";
import { WaitingRoomCardSkeleton } from "./WaitingRoomCardSkeleton";

const meta: Meta<typeof WaitingRoomCard> = {
	component: WaitingRoomCard,
	decorators: [
		(Story) => (
			<div className="grid">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Room/WaitingRoomCard",
};

export default meta;
type Story = StoryFn<typeof WaitingRoomCard>;

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

type PlayerId = WaitingRoom["players"][0]["id"];

const createWaitingRoom = (overrides?: Partial<WaitingRoom>): WaitingRoom => ({
	createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分前
	gameId: "00000000-0000-0000-0000-0000000000a1" as WaitingRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as PlayerId,
			image: null,
			isCpu: false,
			playerName: "ホスト",
			userId: DUMMY_USER_ID,
		},
	],
	timeLimit: 60,
	title: "楽しいお絵描き部屋",
	...overrides,
});

/** 基本 */
export const Default: Story = () => (
	<WaitingRoomCard room={createWaitingRoom()} />
);

/** プライベート */
export const Private: Story = () => (
	<WaitingRoomCard room={createWaitingRoom({ isPrivate: true })} />
);

/** 2人参加 */
export const TwoPlayers: Story = () => (
	<WaitingRoomCard
		room={createWaitingRoom({
			players: [
				{
					id: "player-1" as PlayerId,
					image: null,
					isCpu: false,
					playerName: "ホスト",
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as PlayerId,
					image: null,
					isCpu: false,
					playerName: "参加者A",
					userId: null,
				},
			],
		})}
	/>
);

/** CPU混在 */
export const WithCpu: Story = () => (
	<WaitingRoomCard
		room={createWaitingRoom({
			players: [
				{
					id: "player-1" as PlayerId,
					image: null,
					isCpu: false,
					playerName: "ホスト",
					userId: DUMMY_USER_ID,
				},
				{
					id: "player-2" as PlayerId,
					image: null,
					isCpu: true,
					playerName: "CPU",
					userId: null,
				},
			],
		})}
	/>
);

/** 満員 */
export const FullRoom: Story = () => (
	<WaitingRoomCard
		room={createWaitingRoom({
			players: (["ホスト", "参加者A", "参加者B", "参加者C"] as const).map(
				(playerName, index) => ({
					id: `player-${index + 1}` as PlayerId,
					image: null,
					isCpu: false,
					playerName,
					userId: index === 0 ? DUMMY_USER_ID : null,
				}),
			),
			title: "満員の部屋",
		})}
	/>
);

/** 長いタイトル */
export const LongTitle: Story = () => (
	<WaitingRoomCard
		room={createWaitingRoom({
			title: "とても長いタイトルの部屋名がここに入りますがどうなるでしょうか",
		})}
	/>
);

/** 制限時間バリエーション */
export const DifferentTimeLimits: Story = () => (
	<div className="flex flex-col gap-16">
		{[15, 60, 180, 360].map((timeLimit) => (
			<WaitingRoomCard
				key={timeLimit}
				room={createWaitingRoom({ timeLimit, title: `${timeLimit}秒部屋` })}
			/>
		))}
	</div>
);

/** 実カードと同じ高さ・同じ厚みの色で出す */
export const Loading: Story = () => <WaitingRoomCardSkeleton />;
