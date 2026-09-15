import type { FinishedRoom } from "@repo/db/model";
import type { UserId } from "@repo/db/schema";
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

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

type PlayerId = FinishedRoom["players"][0]["id"];

/** 先頭だけログインユーザー、残りはゲスト */
const createPlayers = (
	entries: { playerName: string; isWinner: boolean }[],
): FinishedRoom["players"] =>
	entries.map(({ playerName, isWinner }, index) => ({
		id: `player-${index + 1}` as PlayerId,
		image: null,
		isCpu: false,
		isWinner,
		playerName,
		userId: index === 0 ? DUMMY_USER_ID : null,
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

/** 実カードと同じ高さ・同じ厚みの色で出す */
export const Loading: Story = () => <FinishedRoomCardSkeleton />;
