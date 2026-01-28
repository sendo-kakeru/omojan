import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorPage } from "./ErrorPage";

const meta = {
	component: ErrorPage,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Components/ErrorPage",
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof ErrorPage>;

export const NotFound: Story = {
	args: {
		statusCode: 404,
	},
	name: "404 - ページが見つかりません",
};

export const Unauthorized: Story = {
	args: {
		statusCode: 401,
	},
	name: "401 - 認証が必要",
};

export const Forbidden: Story = {
	args: {
		statusCode: 403,
	},
	name: "403 - アクセス拒否",
};

export const ServerError: Story = {
	args: {
		statusCode: 500,
	},
	name: "500 - サーバーエラー",
};

export const WithoutHomeButton: Story = {
	args: {
		showHomeButton: false,
		statusCode: 404,
	},
	name: "ホームボタンなし",
};
