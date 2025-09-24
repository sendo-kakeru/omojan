import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./Checkbox";

const meta = {
	component: Checkbox,
	tags: ["autodocs"],
	title: "Components/Form/Checkbox",
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
	args: {},
	render: () => (
		<div className="grid max-w-320 grid-cols-1 gap-y-16">
			<Checkbox label="Default" />
			<Checkbox checked label="Checked" />
			<Checkbox disabled label="Disabled" />
			<Checkbox hasError label="Error" />
		</div>
	),
};
