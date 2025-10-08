import type { Meta, StoryObj } from "@storybook/react-vite";
import { AuthHeader } from "./AuthHeader";

const meta = {
	component: AuthHeader,
	tags: ["autodocs"],
	title: "Components/Auth/AuthHeader",
} satisfies Meta<typeof AuthHeader>;

export default meta;
type Story = StoryObj<typeof AuthHeader>;

export const Unauthenticated: Story = {
	args: {},
	render: () => (
		<div className="grid h-800 w-full grid-cols-1">
			<AuthHeader />
		</div>
	),
};

export const Authenticated: Story = {
	args: {},
	render: () => (
		<div className="grid h-800 w-full grid-cols-1">
			<AuthHeader />
		</div>
	),
};
