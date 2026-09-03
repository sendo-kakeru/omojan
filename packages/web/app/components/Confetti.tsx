import classNames from "classnames";
import type { CSSProperties } from "react";

/**
 * 紙吹雪
 *
 * NOTE: 位置と遅延は固定値の配列にしている。
 * Math.random だとSSRとクライアントで結果が変わりハイドレーションがずれるため
 */
const PIECES = [
	{ className: "size-8 rounded-full bg-gold", delay: 0, left: "6%" },
	{ className: "size-6 bg-brand", delay: 220, left: "14%" },
	{ className: "size-8 rounded-full bg-moss-light", delay: 480, left: "23%" },
	{ className: "h-12 w-4 bg-gold-deep", delay: 120, left: "31%" },
	{ className: "size-6 rounded-full bg-brand", delay: 640, left: "40%" },
	{ className: "size-8 bg-gold", delay: 300, left: "48%" },
	{ className: "h-10 w-4 bg-moss-light", delay: 760, left: "57%" },
	{ className: "size-6 rounded-full bg-gold-deep", delay: 60, left: "65%" },
	{ className: "size-8 bg-brand", delay: 520, left: "73%" },
	{ className: "h-12 w-4 bg-gold", delay: 380, left: "81%" },
	{ className: "size-6 rounded-full bg-moss-light", delay: 700, left: "89%" },
	{ className: "size-8 bg-gold-deep", delay: 180, left: "95%" },
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
					style={
						{
							animationDelay: `${piece.delay}ms`,
							left: piece.left,
						} as CSSProperties
					}
				/>
			))}
		</div>
	);
}
