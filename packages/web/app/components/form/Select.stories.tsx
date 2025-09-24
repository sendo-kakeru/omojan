import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldItem } from "./FieldItem";
import { Select } from "./Select";

const meta = {
	args: {
		children: (
			<>
				<option value="1">選択肢1</option>
				<option value="2">選択肢2</option>
				<option value="3">選択肢3</option>
			</>
		),
		className: "w-320",
	},
	component: Select,
	tags: ["autodocs"],
	title: "Components/Form/Select",
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
	render: (args) => (
		<div className="grid grid-cols-1 gap-y-16">
			<FieldItem label="Default:">
				<Select {...args} id="1" name="1" />
			</FieldItem>
			<FieldItem label="Disabled:">
				<Select {...args} disabled id="2" name="2" />
			</FieldItem>
			<FieldItem label="Error:">
				<Select {...args} aria-invalid id="3" name="3" />
			</FieldItem>
			<FieldItem label="Placeholder:">
				<Select
					{...args}
					id="4"
					name="4"
					placeholder="選択してください選択してください選択してください選択してください選択してください"
				/>
			</FieldItem>
		</div>
	),
};
