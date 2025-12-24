import type { Meta, StoryObj } from "@storybook/react-vite";
import { MatchingError } from "./MatchingError";

const meta: Meta<typeof MatchingError> = {
	component: MatchingError,
	decorators: [
		(Story) => (
			<div className="mx-auto max-w-800">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Matching/Error",
};

export default meta;
type Story = StoryObj<typeof meta>;

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
