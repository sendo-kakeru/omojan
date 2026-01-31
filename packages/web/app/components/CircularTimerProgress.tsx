import classNames from "classnames";

const RADIUS = 15;
const STROKE_WIDTH = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularTimerProgress({
	progress,
	className,
	count,
}: {
	progress: number;
	className?: string;
	count: number;
}) {
	const clampedProgress = Math.min(Math.max(progress, 0), 100);
	const strokeDashoffset = ((100 - clampedProgress) / 100) * CIRCUMFERENCE;
	const isUrgent = count <= 5;

	return (
		<div className={classNames("relative size-32 md:size-40", className)}>
			<svg
				className={classNames(
					"size-full rounded-full bg-white",
					isUrgent ? "text-red-500" : "text-green-500",
				)}
				viewBox="0 0 32 32"
			>
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
					className={classNames(
						"transition-[stroke-dashoffset] duration-1000 ease-linear",
						isUrgent ? "text-red-500" : "text-green-500",
					)}
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
			<p
				className={classNames(
					"absolute inset-0 flex items-center justify-center font-semibold text-sm md:text-lg",
					isUrgent ? "text-red-600" : "text-neutral-900",
				)}
			>
				{count}
			</p>
		</div>
	);
}
