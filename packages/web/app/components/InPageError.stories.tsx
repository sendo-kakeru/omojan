import type { Meta, StoryObj } from "@storybook/react-vite";
import { InPageError } from "./InPageError";

const meta = {
	component: InPageError,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Components/InPageError",
} satisfies Meta<typeof InPageError>;

export default meta;
type Story = StoryObj<typeof InPageError>;

export const Default: Story = {
	args: {
		description: "エラーの詳細説明がここに表示されます。",
		heading: "エラーが発生しました",
	},
	name: "デフォルト",
};

export const WithLogo: Story = {
	args: {
		description: "エラーの詳細説明がここに表示されます。",
		heading: "エラーが発生しました",
		showLogo: true,
	},
	name: "ロゴあり",
};

export const WithoutHomeButton: Story = {
	args: {
		description: "エラーの詳細説明がここに表示されます。",
		heading: "エラーが発生しました",
		showHomeButton: false,
	},
	name: "ホームボタンなし",
};

export const ConnectionError: Story = {
	args: {
		description: "接続に失敗しました。時間をおいて再度お試しください。",
		heading: "接続エラー",
	},
	name: "接続エラー",
};

export const NotFound: Story = {
	args: {
		description: "お探しのリソースは存在しないか、削除された可能性があります。",
		heading: "見つかりません",
	},
	name: "Not Found",
};
