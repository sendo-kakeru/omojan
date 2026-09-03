import type { Meta, StoryFn } from "@storybook/react-vite";
import { Button } from "./button/Button";
import { SectionHeading } from "./SectionHeading";

const meta: Meta<typeof SectionHeading> = {
	component: SectionHeading,
	tags: ["autodocs"],
	title: "Brand/SectionHeading",
};

export default meta;
type Story = StoryFn<typeof SectionHeading>;

/** 件数とアクション付き */
export const WithCountAndAction: Story = () => (
	<SectionHeading
		action={
			<Button as="button" color="brand" size="S" variant="outline">
				部屋作成
			</Button>
		}
		count="2件"
		mark="卓"
	>
		募集中の部屋
	</SectionHeading>
);

/** 見出しのみ */
export const Only: Story = () => (
	<SectionHeading mark="果">最近のゲーム</SectionHeading>
);
