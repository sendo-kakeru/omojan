import type { Meta, StoryObj } from "@storybook/react-vite";
import { AuthUserMenuButton } from "./AuthUserMenuButton";

const meta = {
	component: AuthUserMenuButton,
	tags: ["autodocs"],
	title: "Components/Auth/AuthUserMenuButton",
} satisfies Meta<typeof AuthUserMenuButton>;

export default meta;
type Story = StoryObj<typeof AuthUserMenuButton>;

export const Authenticated: Story = {
	args: {},
	render: () => {
		return <AuthUserMenuButton />;
	},
};

export const Unauthenticated: Story = {
	args: {},
	render: () => {
		return <AuthUserMenuButton />;
	},
};
