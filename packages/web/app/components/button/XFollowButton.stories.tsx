import type { Meta, StoryObj } from "@storybook/react-vite";
import { XFollowButton } from "./XFollowButton";

const meta = {
	component: XFollowButton,
	tags: ["autodocs"],
	title: "Components/Buttons/XFollowButton",
} satisfies Meta<typeof XFollowButton>;

export default meta;
type Story = StoryObj<typeof XFollowButton>;

export const Default: Story = {
	args: {
		username: "omojan_online",
	},
};
