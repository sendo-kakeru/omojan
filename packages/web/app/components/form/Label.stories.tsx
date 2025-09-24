import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./Label";

const meta: Meta<typeof Label> = {
	args: {
		children: "ラベル",
	},
	component: Label,
	tags: ["autodocs"],
	title: "Components/Form/Label",
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = {};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};
