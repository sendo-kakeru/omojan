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

const COLORS = ["primary", "cream"] as const satisfies ComponentProps<
	typeof Badge
>["color"][];

const VARIANTS = ["soft", "fill"] as const satisfies ComponentProps<
	typeof Badge
>["variant"][];

export const ColorList: Story = {
	args: {},
	render: () => (
		<div className="grid w-fit gap-8">
			{VARIANTS.map((variant) => (
				<div className="flex flex-wrap gap-8" key={variant}>
					{COLORS.map((color) => (
						<Badge color={color} key={color} variant={variant}>
							{variant} / {color}
						</Badge>
					))}
				</div>
			))}
		</div>
	),
};

export const Playground: Story = {
	args: {
		children: "Badge",
	},
};
