import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./Separator";

const meta = {
	component: Separator,
	tags: ["autodocs"],
	title: "Components/Separator",
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
	args: {},
	render: () => (
		<div>
			<div className="space-y-4">
				<h4 className="font-medium text-sm leading-none">Radix Primitives</h4>
				<p className="text-muted-foreground text-sm">
					An open-source UI component library.
				</p>
			</div>
			<Separator className="my-16" />
			<div className="flex h-20 items-center space-x-16 text-sm">
				<div>Blog</div>
				<Separator orientation="vertical" />
				<div>Docs</div>
				<Separator orientation="vertical" />
				<div>Source</div>
			</div>
		</div>
	),
};
