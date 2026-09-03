import { tileClassName } from "~/components/Tile";

/**
 * お題の牌
 *
 * ラウンドの主役なので、場に叩きつけられるように登場させる
 */
export function ThemeCard({ theme }: { theme: string }) {
	return (
		<div
			className={tileClassName({
				className:
					"relative grid min-h-60 xs:min-h-68 w-full animate-place-tile place-items-center px-16 py-12 motion-reduce:animate-none",
				stand: "gold",
			})}
		>
			<span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-gold px-12 py-2 font-bold text-[10px] text-moss shadow-sm">
				お題
			</span>
			<p className="text-center font-bold text-base text-carved text-moss sm:text-lg">
				{theme}
			</p>
		</div>
	);
}
