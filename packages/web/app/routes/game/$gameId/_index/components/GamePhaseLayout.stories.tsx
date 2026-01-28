import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";

const meta: Meta<typeof GamePhaseLayout> = {
	component: GamePhaseLayout,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GamePhaseLayout",
};

export default meta;
type Story = StoryObj<typeof GamePhaseLayout>;

// 基本レイアウト
export const Default: Story = {
	args: {
		children: (
			<main className="grid place-items-center rounded-lg border border-gray-200 bg-white p-16">
				<p className="text-neutral-600">メインコンテンツエリア</p>
			</main>
		),
		nav: (
			<GamePhaseNav
				message="ゲームフェーズのメッセージ"
				messageVariant="active"
				roundNo={1}
				timerCount={30}
				timerProgress={100}
			/>
		),
	},
	name: "基本レイアウト",
};

// 複雑なコンテンツ
export const ComplexContent: Story = {
	args: {
		children: (
			<main className="grid grid-rows-[auto_1fr]">
				<section className="grid gap-y-4 rounded-lg border border-gray-200 bg-white p-16">
					<p className="font-bold">プレイヤーリストセクション</p>
					<div className="grid gap-y-2">
						{["プレイヤー1", "プレイヤー2", "プレイヤー3"].map((name) => (
							<div className="rounded bg-gray-100 px-8 py-4 text-sm" key={name}>
								{name}
							</div>
						))}
					</div>
				</section>
				<section className="mt-8 grid place-items-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
					<p className="text-neutral-500">コンテンツエリア</p>
				</section>
			</main>
		),
		nav: (
			<GamePhaseNav
				message="複雑なレイアウトの例"
				messageVariant="inactive"
				roundNo={2}
				timerCount={15}
				timerProgress={50}
			/>
		),
	},
	name: "複雑なコンテンツ",
};
