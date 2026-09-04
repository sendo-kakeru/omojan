import type { Meta, StoryFn } from "@storybook/react-vite";
import { ActiveRoomBadge } from "./ActiveRoomBadge";

const meta: Meta<typeof ActiveRoomBadge> = {
	component: ActiveRoomBadge,
	tags: ["autodocs"],
	title: "Room/ActiveRoomBadge",
};

export default meta;
type Story = StoryFn<typeof ActiveRoomBadge>;

/** 対戦中の部屋がある */
export const WithRooms: Story = () => (
	<ActiveRoomBadge count={2} isLoading={false} />
);

/** 対戦中の部屋が0件 */
export const Empty: Story = () => (
	<ActiveRoomBadge count={0} isLoading={false} />
);

/** ローディング中は何も表示しない */
export const Loading: Story = () => (
	<ActiveRoomBadge count={0} isLoading={true} />
);
