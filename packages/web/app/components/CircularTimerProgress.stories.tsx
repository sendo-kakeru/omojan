import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { useCountdown } from "../hooks/useCountdown";
import { Button } from "./button/Button";
import { CircularTimerProgress } from "./CircularTimerProgress";

const meta = {
	component: CircularTimerProgress,
	tags: ["autodocs"],
	title: "Components/CircularTimerProgress",
} satisfies Meta<typeof CircularTimerProgress>;

export default meta;
type Story = StoryObj<typeof CircularTimerProgress>;

export const Playground: Story = {
	args: {
		count: 12,
		progress: 65,
	},
};

export const Steps: Story = {
	args: {},
	render: () => (
		<div className="flex flex-wrap items-center gap-12">
			<CircularTimerProgress count={30} progress={100} />
			<CircularTimerProgress count={24} progress={80} />
			<CircularTimerProgress count={15} progress={50} />
			<CircularTimerProgress count={6} progress={20} />
			<CircularTimerProgress count={3} progress={10} />
			<CircularTimerProgress count={0} progress={0} />
		</div>
	),
};

export const Countdown: Story = {
	args: {},
	render: () => {
		const { count, progress, start } = useCountdown();

		useEffect(() => {
			start(30);
		}, [start]);

		return (
			<div className="flex flex-col gap-8">
				<CircularTimerProgress count={count} progress={progress} />
				<p className="text-neutral-600 text-sm">残り {count} 秒</p>
				<Button as="button" className="w-fit" onClick={() => start(30)}>
					カウントダウン開始
				</Button>
			</div>
		);
	},
};
