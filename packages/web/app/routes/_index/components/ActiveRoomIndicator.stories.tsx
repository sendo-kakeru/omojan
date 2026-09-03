import type { Meta, StoryFn } from "@storybook/react-vite";
import { ActiveRoomIndicator } from "./ActiveRoomIndicator";

const meta: Meta<typeof ActiveRoomIndicator> = {
	component: ActiveRoomIndicator,
	tags: ["autodocs"],
	title: "Home/ActiveRoomIndicator",
};

export default meta;
type Story = StoryFn<typeof ActiveRoomIndicator>;

/** 対戦中の部屋が複数ある */
export const WithRooms: Story = () => (
	<ActiveRoomIndicator count={3} isLoading={false} />
);

/** 対戦中の部屋が1件 */
export const WithOneRoom: Story = () => (
	<ActiveRoomIndicator count={1} isLoading={false} />
);

/** 対戦中の部屋が多数ある（ドットの個数ではなく数値で表すため件数が増えても崩れない） */
export const ManyRooms: Story = () => (
	<ActiveRoomIndicator count={42} isLoading={false} />
);

/** 対戦中の部屋が0件 */
export const Empty: Story = () => (
	<ActiveRoomIndicator count={0} isLoading={false} />
);

/** ローディング中 */
export const Loading: Story = () => <ActiveRoomIndicator isLoading={true} />;

/** 取得に失敗した場合は何も表示しない */
export const Unavailable: Story = () => (
	<ActiveRoomIndicator isLoading={false} />
);
