import type { FinishedRoom } from "@repo/db/models";
import type { UserId } from "@repo/db/schemas";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { FinishedRoomCard } from "./FinishedRoomCard";
import { FinishedRoomCardSkeleton } from "./FinishedRoomCardSkeleton";

const meta: Meta<typeof FinishedRoomCard> = {
	component: FinishedRoomCard,
	decorators: [
		(Story) => (
			<div className="grid">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Room/FinishedRoomCard",
};

export default meta;
type Story = StoryFn<typeof FinishedRoomCard>;

type PlayerId = FinishedRoom["players"][0]["id"];

const createDummyUserId = (index: number) =>
	`00000000-0000-0000-0000-00000000000${index + 1}` as UserId;

/** hasUser 未指定なら先頭だけログインユーザー、残りはゲスト */
const createPlayers = (
	entries: {
		playerName: string;
		isWinner: boolean;
		hasUser?: boolean;
		isCpu?: boolean;
	}[],
): FinishedRoom["players"] =>
	entries.map(({ playerName, isWinner, hasUser, isCpu = false }, index) => ({
		id: `player-${index + 1}` as PlayerId,
		image: null,
		isCpu,
		isWinner,
		playerName,
		userId: (hasUser ?? index === 0) ? createDummyUserId(index) : null,
	}));

const createFinishedRoom = (
	overrides?: Partial<FinishedRoom>,
): FinishedRoom => ({
	finishedAt: new Date(2024, 0, 15).toISOString(), // 2024/01/15
	gameId: "00000000-0000-0000-0000-0000000000a2" as FinishedRoom["gameId"],
	isPrivate: false,
	players: createPlayers([
		{ isWinner: true, playerName: "プレイヤー1" },
		{ isWinner: false, playerName: "プレイヤー2" },
		{ isWinner: false, playerName: "プレイヤー3" },
		{ isWinner: false, playerName: "プレイヤー4" },
	]),
	timeLimit: 60,
	title: "終了した部屋",
	...overrides,
});

/** 基本 */
export const Default: Story = () => (
	<FinishedRoomCard room={createFinishedRoom()} />
);

/** 複数優勝者 */
export const MultipleWinners: Story = () => (
	<FinishedRoomCard
		room={createFinishedRoom({
			players: createPlayers([
				{ isWinner: true, playerName: "優勝者A" },
				{ isWinner: true, playerName: "優勝者B" },
				{ isWinner: false, playerName: "参加者C" },
				{ isWinner: false, playerName: "参加者D" },
			]),
			title: "同点優勝の部屋",
		})}
	/>
);

/** 長い優勝者名 */
export const LongWinnerName: Story = () => (
	<FinishedRoomCard
		room={createFinishedRoom({
			players: createPlayers([
				{
					isWinner: true,
					playerName: "とても長いプレイヤー名のユーザーがここに入ります",
				},
				{ isWinner: false, playerName: "参加者B" },
				{ isWinner: false, playerName: "参加者C" },
			]),
		})}
	/>
);

/** 長いタイトル */
export const LongTitle: Story = () => (
	<FinishedRoomCard
		room={createFinishedRoom({
			title: "とても長いタイトルの部屋名がここに入りますがどうなるでしょうか",
		})}
	/>
);

/** 全員ログインユーザー（全員がユーザーページへのリンクになる） */
export const AllUsersLinked: Story = () => (
	<FinishedRoomCard
		room={createFinishedRoom({
			players: createPlayers([
				{ hasUser: true, isWinner: true, playerName: "優勝者A" },
				{ hasUser: true, isWinner: false, playerName: "参加者B" },
				{ hasUser: true, isWinner: false, playerName: "参加者C" },
				{ hasUser: true, isWinner: false, playerName: "参加者D" },
			]),
			title: "全員ログイン済みの部屋",
		})}
	/>
);

/** ゲスト・CPU混在（リンクにならないプレイヤーがいる） */
export const WithGuestAndCpu: Story = () => (
	<FinishedRoomCard
		room={createFinishedRoom({
			players: createPlayers([
				{ hasUser: true, isWinner: true, playerName: "優勝者A" },
				{ hasUser: false, isWinner: false, playerName: "ゲストB" },
				{ hasUser: false, isCpu: true, isWinner: false, playerName: "CPU" },
				{ hasUser: true, isWinner: false, playerName: "参加者D" },
			]),
			title: "ゲストとCPUがいる部屋",
		})}
	/>
);

/** 実カードと同じ高さ・同じ厚みの色で出す */
export const Loading: Story = () => <FinishedRoomCardSkeleton />;
