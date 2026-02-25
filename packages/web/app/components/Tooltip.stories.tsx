import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button/Button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
	component: Tooltip,
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
	tags: ["autodocs"],
	title: "Components/Tooltip",
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button as="button" type="button">
					Hover me
				</Button>
			</TooltipTrigger>
			<TooltipContent>This is a tooltip</TooltipContent>
		</Tooltip>
	),
};

const SIDES = ["top", "right", "bottom", "left"] as const;

export const Sides: Story = {
	render: () => (
		<div className="flex items-center justify-center gap-16 p-32">
			{SIDES.map((side) => (
				<Tooltip key={side}>
					<TooltipTrigger asChild>
						<Button as="button" type="button">
							{side}
						</Button>
					</TooltipTrigger>
					<TooltipContent side={side}>Tooltip on {side}</TooltipContent>
				</Tooltip>
			))}
		</div>
	),
};
