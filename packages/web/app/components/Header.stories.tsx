import type { Meta, StoryObj } from "@storybook/react-vite";
import { Header } from "./Header";

const meta = {
	component: Header,
	tags: ["autodocs"],
	title: "Components/Auth/Header",
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

export const Unauthenticated: Story = {
	args: {},
	render: () => (
		<div className="grid h-800 w-full grid-cols-1">
			<Header />
		</div>
	),
};

export const Authenticated: Story = {
	args: {},
	parameters: {
		authed: true,
	},
	render: () => (
		<div className="grid h-800 w-full grid-cols-1">
			<Header />
		</div>
	),
};
