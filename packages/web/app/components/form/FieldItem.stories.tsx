import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldItem } from "./FieldItem";
import { Input } from "./Input";

const meta = {
	args: {
		children: <Input placeholder="placeholder" />,
		errorMessage:
			"エラーメッセージです。エラーメッセージです。エラーメッセージです。",
		htmlFor: "dummy",
		label: "ラベル",
		note: "注釈です。",
		required: true,
		supportText: "サポートテキストです。サポートテキストです。",
	},
	component: FieldItem,
	tags: ["autodocs"],
	title: "Components/Form/FieldItem",
} satisfies Meta<typeof FieldItem>;

export default meta;
type Story = StoryObj<typeof FieldItem>;

export const Default: Story = {
	args: {},
};
