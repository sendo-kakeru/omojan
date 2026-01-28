import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatchingError } from "./MatchingError";

const meta = {
	component: MatchingError,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Matching/Error",
} satisfies Meta<typeof MatchingError>;

export default meta;
type Story = StoryObj<typeof MatchingError>;

export const NotFound: Story = {
	args: {
		errorType: "notFound",
	},
	name: "部屋が見つからない（404）",
};

export const Forbidden: Story = {
	args: {
		errorType: "forbidden",
	},
	name: "権限なし（403）",
};

export const Unauthorized: Story = {
	args: {
		errorType: "unauthorized",
	},
	name: "未認証（401）",
};

export const ConnectionError: Story = {
	args: {
		errorType: "connectionError",
	},
	name: "接続エラー",
};
