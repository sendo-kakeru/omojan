import type { Meta, StoryFn } from "@storybook/react-vite";
import { HomeTitle } from "./HomeTitle";

const meta: Meta<typeof HomeTitle> = {
	component: HomeTitle,
	decorators: [
		(Story) => (
			<div className="grid min-h-svh place-items-center bg-table px-16 py-32 font-sans">
				<Story />
			</div>
		),
	],
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	title: "Home/HomeTitle",
};

export default meta;
type Story = StoryFn<typeof HomeTitle>;

export const Default: Story = () => <HomeTitle />;
