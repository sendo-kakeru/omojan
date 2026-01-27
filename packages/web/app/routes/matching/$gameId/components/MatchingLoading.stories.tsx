import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatchingLoading } from "./MatchingLoading";

const meta: Meta<typeof MatchingLoading> = {
	component: MatchingLoading,
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-800">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Matching/Loading",
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Connecting: Story = {
	args: {
		message: "接続しています...",
	},
	name: "接続中",
};

export const Exiting: Story = {
	args: {
		message: "退出しています...",
	},
	name: "退出中",
};
