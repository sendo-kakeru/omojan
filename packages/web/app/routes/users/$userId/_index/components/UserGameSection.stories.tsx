import type { FinishedRoom } from "@repo/db/models";
import type { UserId } from "@repo/db/schemas";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { UserGameSection } from "./UserGameSection";

const meta: Meta<typeof UserGameSection> = {
	component: UserGameSection,
	tags: ["autodocs"],
	title: "User/UserGameSection",
};

export default meta;
type Story = StoryFn<typeof UserGameSection>;

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

const createFinishedRoom = (
	overrides?: Partial<FinishedRoom>,
): FinishedRoom => ({
	finishedAt: new Date(2024, 0, 15).toISOString(),
	gameId: crypto.randomUUID() as FinishedRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as FinishedRoom["players"][0]["id"],
			image: null,
			isCpu: false,
			isWinner: true,
			playerName: "プレイヤー1",
			userId: DUMMY_USER_ID,
		},
		{
			id: "player-2" as FinishedRoom["players"][0]["id"],
			image: null,
			isCpu: false,
			isWinner: false,
			playerName: "プレイヤー2",
			userId: null,
		},
		{
			id: "player-3" as FinishedRoom["players"][0]["id"],
			image: null,
			isCpu: false,
			isWinner: false,
			playerName: "プレイヤー3",
			userId: null,
		},
		{
			id: "player-4" as FinishedRoom["players"][0]["id"],
			image: null,
			isCpu: false,
			isWinner: false,
			playerName: "プレイヤー4",
			userId: null,
		},
	],
	timeLimit: 60,
	title: "終了した部屋",
	...overrides,
});

/** 対戦履歴が3件（もっと見るなし） */
export const WithRooms: Story = () => (
	<UserGameSection
		isLoading={false}
		rooms={[
			createFinishedRoom({ title: "熱戦のゲーム" }),
			createFinishedRoom({ title: "接戦だった部屋" }),
			createFinishedRoom({ title: "初心者部屋" }),
		]}
		total={3}
		userId={DUMMY_USER_ID}
	/>
);

/** 5件表示でtotalが6件以上（もっと見るあり） */
export const WithMoreButton: Story = () => (
	<UserGameSection
		isLoading={false}
		rooms={[
			createFinishedRoom({ title: "ゲーム1" }),
			createFinishedRoom({ title: "ゲーム2" }),
			createFinishedRoom({ title: "ゲーム3" }),
			createFinishedRoom({ title: "ゲーム4" }),
			createFinishedRoom({ title: "ゲーム5" }),
		]}
		total={12}
		userId={DUMMY_USER_ID}
	/>
);

/** 5件ちょうど（もっと見るなし） */
export const ExactlyFive: Story = () => (
	<UserGameSection
		isLoading={false}
		rooms={[
			createFinishedRoom({ title: "ゲーム1" }),
			createFinishedRoom({ title: "ゲーム2" }),
			createFinishedRoom({ title: "ゲーム3" }),
			createFinishedRoom({ title: "ゲーム4" }),
			createFinishedRoom({ title: "ゲーム5" }),
		]}
		total={5}
		userId={DUMMY_USER_ID}
	/>
);

/** 対戦履歴が0件 */
export const Empty: Story = () => (
	<UserGameSection
		isLoading={false}
		rooms={[]}
		total={0}
		userId={DUMMY_USER_ID}
	/>
);

/** ローディング中 */
export const Loading: Story = () => (
	<UserGameSection isLoading={true} userId={DUMMY_USER_ID} />
);

/** エラー */
export const ErrorState: Story = () => (
	<UserGameSection
		error={new globalThis.Error("Failed to fetch")}
		isLoading={false}
		rooms={undefined}
		userId={DUMMY_USER_ID}
	/>
);
