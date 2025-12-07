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
		label: 12,
		progress: 65,
	},
};

export const Steps: Story = {
	args: {},
	render: () => (
		<div className="flex flex-wrap items-center gap-12">
			<CircularTimerProgress label={30} progress={100} />
			<CircularTimerProgress label={24} progress={80} />
			<CircularTimerProgress label={15} progress={50} />
			<CircularTimerProgress label={6} progress={20} />
			<CircularTimerProgress label={0} progress={0} />
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
				<CircularTimerProgress label={count} progress={progress} />
				<p className="text-gray-600 text-sm">残り {count} 秒</p>
				<Button as="button" className="w-fit" onClick={() => start(30)}>
					カウントダウン開始
				</Button>
			</div>
		);
	},
};
