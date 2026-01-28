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
		message: "あなたの番です。面白いと思う組み合わせを選んでください。",
		messageVariant: "active",
		roundNo: 1,
		timerCount: 30,
		timerProgress: 100,
	},
	name: "基本（アクティブ）",
};

// 非アクティブ状態
export const Inactive: Story = {
	args: {
		message: "他のプレイヤーの提出を待っています。",
		messageVariant: "inactive",
		roundNo: 2,
		timerCount: 15,
		timerProgress: 50,
	},
	name: "非アクティブ状態",
};

// 各ラウンド
export const AllRounds: Story = {
	name: "各ラウンド表示",
	render: () => (
		<div className="grid gap-y-16">
			{[1, 2, 3, 4].map((roundNo) => (
				<GamePhaseNav
					key={roundNo}
					message={`ラウンド ${roundNo} のメッセージ`}
					messageVariant={roundNo % 2 === 1 ? "active" : "inactive"}
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
			<GamePhaseNav
				message="カウントダウン中..."
				messageVariant="active"
				roundNo={1}
				timerCount={count}
				timerProgress={progress}
			/>
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
