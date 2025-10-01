import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button/Button";
import { ToastItem, useToast } from "./Toast";

const meta = {
	args: {
		id: "1",
		isOpen: true,
		title: "更新しました",
		type: "success",
	},
	component: ToastItem,
	tags: ["autodocs"],
	title: "Components/Toast",
} satisfies Meta<typeof ToastItem>;

export default meta;
type Story = StoryObj<typeof ToastItem>;

export const TypeList: Story = {
	render: (args) => (
		<div>
			<meta.component
				{...args}
				title="更新しました更新しました更新しました更新しました更新しました更新しました更新しました更新しました更新しました更新しました"
			/>
			<meta.component {...args} type="error" />
			<meta.component {...args} type="warning" />
		</div>
	),
};

export const Control: Story = {
	render: () => {
		const { showToast } = useToast();
		return (
			<Button
				as="button"
				onClick={() =>
					showToast({
						title: "更新しました",
						type: "success",
					})
				}
				type="button"
			>
				Show Toast
			</Button>
		);
	},
};
