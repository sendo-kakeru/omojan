import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Avatar } from "./Avatar";

const meta = {
	component: Avatar,
	tags: ["autodocs"],
	title: "Components/Avatar",
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

const SIZES = ["S", "M", "L"] as const satisfies ComponentProps<
	typeof Avatar
>["size"][];

export const SizeList: Story = {
	args: {},
	render: () => (
		<div className="grid grid-cols-1 gap-y-24">
			{SIZES.map((size) => (
				<div className="grid grid-cols-1 gap-y-8" key={size}>
					<p>size: {size}</p>
					<div className="flex gap-x-16">
						<Avatar name="John Doe" size={size} src="favicon.ico" />
						<Avatar name="John Doe" size={size} />
					</div>
				</div>
			))}
		</div>
	),
};
