import type { Meta, StoryObj } from "@storybook/react-vite";
import { GoogleSigninButton } from "./GoogleSigninButton";

const meta = {
	component: GoogleSigninButton,
	tags: ["autodocs"],
	title: "Components/Buttons/GoogleSigninButton",
} satisfies Meta<typeof GoogleSigninButton>;

export default meta;
type Story = StoryObj<typeof GoogleSigninButton>;

export const Default: Story = {
	args: { children: "Googleでサインイン" },
};
