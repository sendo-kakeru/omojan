import classNames from "classnames";

/**
 * 紙吹雪
 */
const PIECES = [
	{ className: "size-8 rounded-full bg-amber-300", delay: 0, left: "6%" },
	{ className: "size-6 bg-orange-600", delay: 220, left: "14%" },
	{ className: "size-8 rounded-full bg-lime-600", delay: 480, left: "23%" },
	{ className: "h-12 w-4 bg-amber-500", delay: 120, left: "31%" },
	{ className: "size-6 rounded-full bg-orange-600", delay: 640, left: "40%" },
	{ className: "size-8 bg-amber-300", delay: 300, left: "48%" },
	{ className: "h-10 w-4 bg-lime-600", delay: 760, left: "57%" },
	{ className: "size-6 rounded-full bg-amber-500", delay: 60, left: "65%" },
	{ className: "size-8 bg-orange-600", delay: 520, left: "73%" },
	{ className: "h-12 w-4 bg-amber-300", delay: 380, left: "81%" },
	{ className: "size-6 rounded-full bg-lime-600", delay: 700, left: "89%" },
	{ className: "size-8 bg-amber-500", delay: 180, left: "95%" },
] as const;

export function Confetti() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-30 overflow-hidden motion-reduce:hidden"
		>
			{PIECES.map((piece) => (
				<span
					className={classNames(
						"absolute -top-16 block animate-confetti",
						piece.className,
					)}
					key={piece.left}
					style={{
						animationDelay: `${piece.delay}ms`,
						left: piece.left,
					}}
				/>
			))}
		</div>
	);
}
