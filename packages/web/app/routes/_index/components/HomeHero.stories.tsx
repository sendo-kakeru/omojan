import type { Meta, StoryFn } from "@storybook/react-vite";
import { HomeHero } from "./HomeHero";

const meta: Meta<typeof HomeHero> = {
	component: HomeHero,
	parameters: {
		backgrounds: { value: "tatami" },
	},
	tags: ["autodocs"],
	title: "Home/HomeHero",
};

export default meta;
type Story = StoryFn<typeof HomeHero>;

const noop = () => {};

/** 対戦中の部屋がある */
export const WithActiveRooms: Story = () => (
	<HomeHero activeRoomCount={3} onCreateRoom={noop} />
);

/** 対戦中の部屋が0件 */
export const NoActiveRooms: Story = () => (
	<HomeHero activeRoomCount={0} onCreateRoom={noop} />
);

/** 対戦状況が未取得（ライブ表示は出さない） */
export const WithoutStatus: Story = () => <HomeHero onCreateRoom={noop} />;
