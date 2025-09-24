import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldItem } from "./FieldItem";
import { Input } from "./Input";

const meta = {
	component: Input,
	tags: ["autodocs"],
	title: "Components/Form/Input",
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
	args: {},
	render: () => (
		<div className="grid max-w-320 grid-cols-1 gap-y-16">
			<FieldItem label="Default:">
				<Input />
			</FieldItem>
			<FieldItem label="入力中:">
				<Input value="Hello" />
			</FieldItem>
			<FieldItem label="Placeholder:">
				<Input placeholder="Placeholder" />
			</FieldItem>
			<FieldItem label="Disabled:">
				<Input disabled />
			</FieldItem>
			<FieldItem label="Error:">
				<Input aria-invalid="true" />
			</FieldItem>
		</div>
	),
};
