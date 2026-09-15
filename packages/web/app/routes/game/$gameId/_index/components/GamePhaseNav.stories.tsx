import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useCountdown } from "~/hooks/useCountdown";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { GamePhaseNav, RoundIndicator } from "./GamePhaseNav";

const meta: Meta<typeof GamePhaseNav> = {
	component: GamePhaseNav,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/GamePhaseNav",
};

export default meta;
type Story = StoryObj<typeof GamePhaseNav>;

// 基本的な使用例
export const Default: Story = {
	args: {
		roundNo: 1,
		// NOTE: 画面には出ない。読み上げ専用
		statusText: "あなたの番です",
		timerCount: 30,
		timerProgress: 100,
	},
	name: "基本",
};

// 残り時間が少ない状態
export const LowTimer: Story = {
	args: {
		roundNo: 2,
		statusText: "他のプレイヤーの番です",
		timerCount: 5,
		timerProgress: 16,
	},
	name: "残り時間わずか",
};

// 各ラウンド
export const AllRounds: Story = {
	name: "各ラウンド表示",
	render: () => (
		<div className="grid gap-y-16">
			{[1, 2, 3, 4].map((roundNo) => (
				<GamePhaseNav
					key={roundNo}
					roundNo={roundNo}
					timerCount={30 - (roundNo - 1) * 5}
					timerProgress={100 - (roundNo - 1) * 20}
				/>
			))}
		</div>
	),
};

// カウントダウン付き
export const WithCountdown: Story = {
	name: "カウントダウン動作",
	render: () => {
		const { count, progress, start } = useCountdown();

		useEffect(() => {
			start(30);
		}, [start]);

		return (
			<GamePhaseNav roundNo={1} timerCount={count} timerProgress={progress} />
		);
	},
};

// RoundIndicator単体
export const RoundIndicatorOnly: Story = {
	name: "RoundIndicator単体",
	render: () => (
		<div className="flex gap-8">
			<RoundIndicator roundNo={1} />
			<RoundIndicator roundNo={2} />
			<RoundIndicator roundNo={3} />
			<RoundIndicator roundNo={4} />
		</div>
	),
};
