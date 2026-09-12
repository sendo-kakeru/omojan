import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { Avatar } from "./Avatar";

const meta = {
	component: Avatar,
	tags: ["autodocs"],
	title: "Components/Avatar",
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof Avatar>;

const SIZES = ["S", "M", "L", "XL"] as const satisfies ComponentProps<
	typeof Avatar
>["size"][];

export const SizeList: Story = {
	args: {},
	render: () => (
		<div className="grid grid-cols-1 gap-y-24">
			{SIZES.map((size) => (
				<div className="grid grid-cols-1 gap-y-8" key={size}>
					<p>size: {size}</p>
					<div className="flex gap-x-16">
						<Avatar name="John Doe" size={size} src="favicon.ico" />
						<Avatar name="John Doe" size={size} />
						<Avatar name="" size={size} />
					</div>
				</div>
			))}
		</div>
	),
};

/**
 * パレットの5色それぞれに当たる名前
 */
const PALETTE_SAMPLE_NAMES = [
	{ colorClassName: "bg-orange-700", name: "さくら" },
	{ colorClassName: "bg-lime-800", name: "そら" },
	{ colorClassName: "bg-amber-700", name: "けんた" },
	{ colorClassName: "bg-red-700", name: "りく" },
	{ colorClassName: "bg-lime-900", name: "はなこ" },
] as const;

export const ColorList: Story = {
	args: {},
	name: "名前ごとの色",
	render: () => (
		<div className="grid grid-cols-1 gap-y-16">
			<p className="text-sm">
				画像が無い場合、名前から決定的に色を選ぶ（同じ名前は常に同じ色）
			</p>
			<div className="flex flex-wrap gap-16">
				{PALETTE_SAMPLE_NAMES.map(({ colorClassName, name }) => (
					<div className="grid justify-items-center gap-y-4" key={name}>
						<Avatar name={name} size="L" />
						<p className="text-sm">{name}</p>
						<p className="text-neutral-500 text-xs">{colorClassName}</p>
					</div>
				))}
			</div>
		</div>
	),
};
