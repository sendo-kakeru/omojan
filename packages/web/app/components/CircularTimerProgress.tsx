import classNames from "classnames";
import type { ReactNode } from "react";

const RADIUS = 15;
const STROKE_WIDTH = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularTimerProgress({
	progress,
	label,
	className,
}: {
	progress: number;
	label?: ReactNode;
	className?: string;
}) {
	const clampedProgress = Math.min(Math.max(progress, 0), 100);
	const strokeDashoffset = ((100 - clampedProgress) / 100) * CIRCUMFERENCE;

	return (
		<div className={classNames("relative size-32 md:size-40", className)}>
			<svg className="size-full text-green-500" viewBox="0 0 32 32">
				<title className="sr-only">Timer</title>
				<circle
					className="text-neutral-200"
					cx="16"
					cy="16"
					fill="none"
					r={RADIUS}
					stroke="currentColor"
					strokeWidth={STROKE_WIDTH}
				/>
				<circle
					className="text-green-500 transition-[stroke-dashoffset] duration-1000 ease-linear"
					cx="16"
					cy="16"
					fill="none"
					r={RADIUS}
					stroke="currentColor"
					strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
					strokeWidth={STROKE_WIDTH}
					transform="rotate(-90 16 16)"
				/>
			</svg>
			<p className="absolute inset-0 flex items-center justify-center font-semibold text-neutral-900 text-sm md:text-lg">
				{label ?? Math.round(clampedProgress)}
			</p>
		</div>
	);
}
