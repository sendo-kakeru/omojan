import type { FinishedRoom } from "@repo/db/model";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { FinishedRoomSection } from "./FinishedRoomSection";

const meta: Meta<typeof FinishedRoomSection> = {
	component: FinishedRoomSection,
	tags: ["autodocs"],
	title: "Room/FinishedRoomSection",
};

export default meta;
type Story = StoryFn<typeof FinishedRoomSection>;

const createFinishedRoom = (
	overrides?: Partial<FinishedRoom>,
): FinishedRoom => ({
	finishedAt: new Date(2024, 0, 15).toISOString(),
	gameId:
		`game-${Math.random().toString(36).slice(2)}` as FinishedRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: true,
			playerName: "プレイヤー1",
			seat: 1,
		},
		{
			id: "player-2" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー2",
			seat: 2,
		},
		{
			id: "player-3" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー3",
			seat: 3,
		},
		{
			id: "player-4" as FinishedRoom["players"][0]["id"],
			image: null,
			isWinner: false,
			playerName: "プレイヤー4",
			seat: 4,
		},
	],
	timeLimit: 60,
	title: "終了した部屋",
	...overrides,
});

/** 終了したゲームが複数ある（すべて見るリンクあり） */
export const WithRooms: Story = () => (
	<FinishedRoomSection
		isLoading={false}
		rooms={[
			createFinishedRoom({ title: "熱戦のゲーム" }),
			createFinishedRoom({ title: "接戦だった部屋" }),
			createFinishedRoom({ title: "初心者部屋" }),
		]}
	/>
);

/** 終了したゲームが1件 */
export const WithOneRoom: Story = () => (
	<FinishedRoomSection isLoading={false} rooms={[createFinishedRoom()]} />
);

/** 終了したゲームが0件 */
export const Empty: Story = () => (
	<FinishedRoomSection isLoading={false} rooms={[]} />
);

/** ローディング中 */
export const Loading: Story = () => <FinishedRoomSection isLoading={true} />;

/** エラー */
export const ErrorState: Story = () => (
	<FinishedRoomSection
		error={new globalThis.Error("Failed to fetch")}
		isLoading={false}
		rooms={undefined}
	/>
);

/** 5件表示（トップページの最大表示数） */
export const FiveRooms: Story = () => (
	<FinishedRoomSection
		isLoading={false}
		rooms={[
			createFinishedRoom({ title: "ゲーム1" }),
			createFinishedRoom({ title: "ゲーム2" }),
			createFinishedRoom({ title: "ゲーム3" }),
			createFinishedRoom({ title: "ゲーム4" }),
			createFinishedRoom({ title: "ゲーム5" }),
		]}
	/>
);
