import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./Spinner";

const meta = {
	component: Spinner,
	tags: ["autodocs"],
	title: "Components/Spinner",
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof Spinner>;

export const SizeList: Story = {
	args: {},
	render: () => (
		<div className="grid grid-cols-1 gap-y-24">
			<Spinner className="size-8" />
			<Spinner />
			<Spinner className="size-24" />
			<Spinner className="size-32" />
		</div>
	),
};

export const ColorList: Story = {
	args: {},
	render: () => (
		<div className="grid grid-cols-1 gap-y-24">
			<Spinner className="size-32 text-red-500" />
			<Spinner className="size-32 text-green-500" />
			<Spinner className="size-32 text-blue-500" />
			<Spinner className="size-32 text-yellow-500" />
			<Spinner className="size-32 text-purple-500" />
		</div>
	),
};
