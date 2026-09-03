import type { Meta, StoryFn } from "@storybook/react-vite";
import { Tile } from "./Tile";

const meta: Meta<typeof Tile> = {
	component: Tile,
	tags: ["autodocs"],
	title: "Brand/Tile",
};

export default meta;
type Story = StoryFn<typeof Tile>;

const STANDS = ["ivory", "gold", "moss", "brand"] as const;

/** 台座（牌の厚み）のバリエーション */
export const Stands: Story = () => (
	<div className="flex items-end gap-x-16 p-24">
		{STANDS.map((stand) => (
			<Tile
				className="grid size-56 place-items-center"
				key={stand}
				stand={stand}
			>
				<span className="font-bold text-brand text-carved text-xl">牌</span>
			</Tile>
		))}
	</div>
);

/** 操作できる牌（ホバーで持ち上がり、押すと沈む） */
export const Interactive: Story = () => (
	<div className="flex items-end gap-x-16 p-24">
		{STANDS.map((stand) => (
			<Tile
				className="grid size-56 place-items-center"
				interactive
				key={stand}
				stand={stand}
			>
				<span className="font-bold text-carved text-moss text-xl">押</span>
			</Tile>
		))}
	</div>
);

/** 言葉を載せた牌（手札の想定） */
export const WithWords: Story = () => (
	<div className="flex flex-wrap items-end gap-8 p-24">
		{["ぶっちゃけ", "死亡フラグ", "メガネ", "校", "浅漬け"].map((word) => (
			<Tile
				className="px-12 py-8 font-bold text-neutral-800"
				interactive
				key={word}
				stand="gold"
			>
				{word}
			</Tile>
		))}
	</div>
);
