import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameError } from "./GameError";

const meta = {
	component: GameError,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Game/Error",
} satisfies Meta<typeof GameError>;

export default meta;
type Story = StoryObj<typeof GameError>;

export const ConnectionError: Story = {
	args: {
		errorType: "connectionError",
	},
	name: "接続エラー",
};

export const Unknown: Story = {
	args: {
		errorType: "unknown",
	},
	name: "不明なエラー",
};
