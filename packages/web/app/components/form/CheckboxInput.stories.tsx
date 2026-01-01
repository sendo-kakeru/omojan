import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckboxInput } from "./CheckboxInput";
import { FieldItem } from "./FieldItem";

const meta = {
	component: CheckboxInput,
	tags: ["autodocs"],
	title: "Components/Form/CheckboxInput",
} satisfies Meta<typeof CheckboxInput>;

export default meta;
type Story = StoryObj<typeof CheckboxInput>;

export const Default: Story = {
	args: {},
	render: () => (
		<div className="grid max-w-200 grid-cols-1 gap-y-16">
			<FieldItem label="Default:">
				<CheckboxInput />
			</FieldItem>
			<FieldItem label="Checked:">
				<CheckboxInput checked />
			</FieldItem>
			<FieldItem label="Disabled:">
				<CheckboxInput disabled />
			</FieldItem>
			<FieldItem label="Error:">
				<CheckboxInput aria-invalid />
			</FieldItem>
		</div>
	),
};
