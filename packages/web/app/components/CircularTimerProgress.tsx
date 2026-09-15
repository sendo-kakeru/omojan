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
		<div
			className={classNames(
				"relative size-32 md:size-40",
				// 残り5秒でタイマー自体を少し大きく見せて緊迫感を出す
				isUrgent && "scale-110 transition-transform",
				className,
			)}
		>
			<svg
				className={classNames(
					"size-full rounded-full bg-cream-50 shadow-tile",
					isUrgent ? "text-orange-600" : "text-lime-800",
				)}
				viewBox="0 0 32 32"
			>
				<title className="sr-only">Timer</title>
				<circle
					className="text-cream-200"
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
						isUrgent ? "text-orange-600" : "text-lime-800",
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
					"absolute inset-0 flex items-center justify-center font-display text-sm md:text-lg",
					isUrgent
						? "animate-pulse font-bold text-orange-700 motion-reduce:animate-none"
						: "text-lime-800",
				)}
			>
				{count}
			</p>
		</div>
	);
}
