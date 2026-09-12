import type { Meta, StoryFn } from "@storybook/react-vite";
import { HeroCreateRoomButton } from "./HeroCreateRoomButton";

const meta: Meta<typeof HeroCreateRoomButton> = {
	component: HeroCreateRoomButton,
	decorators: [
		(Story) => (
			<div className="grid min-h-svh place-items-center bg-table p-32 font-sans">
				<Story />
			</div>
		),
	],
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Home/HeroCreateRoomButton",
};

export default meta;
type Story = StoryFn<typeof HeroCreateRoomButton>;

export const Default: Story = () => <HeroCreateRoomButton onClick={() => {}} />;
