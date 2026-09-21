import type { WaitingRoom } from "@repo/db/models";
import type { UserId } from "@repo/db/schemas";
import type { Meta, StoryFn } from "@storybook/react-vite";
import { WaitingRoomSection } from "./WaitingRoomSection";

const meta: Meta<typeof WaitingRoomSection> = {
	component: WaitingRoomSection,
	tags: ["autodocs"],
	title: "Room/WaitingRoomSection",
};

export default meta;
type Story = StoryFn<typeof WaitingRoomSection>;

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000001" as UserId;

const createWaitingRoom = (overrides?: Partial<WaitingRoom>): WaitingRoom => ({
	createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
	gameId:
		`game-${Math.random().toString(36).slice(2)}` as WaitingRoom["gameId"],
	isPrivate: false,
	players: [
		{
			id: "player-1" as WaitingRoom["players"][0]["id"],
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

const noop = () => {};

/** 募集中の部屋が複数ある */
export const WithRooms: Story = () => (
	<WaitingRoomSection
		isLoading={false}
		onCreateRoom={noop}
		onRefresh={noop}
		rooms={[
			createWaitingRoom({ title: "初心者歓迎！" }),
			createWaitingRoom({
				players: [
					{
						id: "player-1" as WaitingRoom["players"][0]["id"],
						image: null,
						isCpu: false,
						playerName: "ホスト",
						userId: DUMMY_USER_ID,
					},
					{
						id: "player-2" as WaitingRoom["players"][0]["id"],
						image: null,
						isCpu: false,
						playerName: "参加者A",
						userId: null,
					},
				],
				title: "ガチ勢集合",
			}),
			createWaitingRoom({
				isPrivate: true,
				title: "友達限定",
			}),
		]}
	/>
);

/** 募集中の部屋が1件 */
export const WithOneRoom: Story = () => (
	<WaitingRoomSection
		isLoading={false}
		onCreateRoom={noop}
		onRefresh={noop}
		rooms={[createWaitingRoom()]}
	/>
);

/** 募集中の部屋が0件 */
export const Empty: Story = () => (
	<WaitingRoomSection
		isLoading={false}
		onCreateRoom={noop}
		onRefresh={noop}
		rooms={[]}
	/>
);

/** ローディング中 */
export const Loading: Story = () => (
	<WaitingRoomSection isLoading={true} onCreateRoom={noop} onRefresh={noop} />
);

/** エラー */
export const ErrorState: Story = () => (
	<WaitingRoomSection
		error={new globalThis.Error("Failed to fetch")}
		isLoading={false}
		onCreateRoom={noop}
		onRefresh={noop}
		rooms={undefined}
	/>
);

/** 募集中の部屋が多数ある */
export const ManyRooms: Story = () => (
	<WaitingRoomSection
		isLoading={false}
		onCreateRoom={noop}
		onRefresh={noop}
		rooms={[
			createWaitingRoom({ title: "部屋1" }),
			createWaitingRoom({ title: "部屋2" }),
			createWaitingRoom({ title: "部屋3" }),
			createWaitingRoom({ title: "部屋4" }),
			createWaitingRoom({ title: "部屋5" }),
		]}
	/>
);
