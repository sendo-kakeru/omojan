import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Badge } from "./Badge";

const meta = {
	component: Badge,
	tags: ["autodocs"],
	title: "Components/Badge",
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

const COLORS = [
	"primary",
	"danger",
	"black",
	"gray",
] as const satisfies ComponentProps<typeof Badge>["color"][];

export const ColorList: Story = {
	args: {},
	render: () => (
		<div className="flex flex-wrap gap-8">
			{COLORS.map((color) => (
				<Badge color={color} key={color}>
					{color}
				</Badge>
			))}
		</div>
	),
};

export const Playground: Story = {
	args: {
		children: "Badge",
	},
};
