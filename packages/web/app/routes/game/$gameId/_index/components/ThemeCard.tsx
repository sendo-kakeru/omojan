import { Tile } from "~/components/Tile";

/**
 * お題の牌
 */
export function ThemeCard({ theme }: { theme: string }) {
	return (
		<Tile
			className="relative grid min-h-60 xs:min-h-68 w-full animate-place-tile place-items-center px-16 py-12 motion-reduce:animate-none"
			thickness="amber"
		>
			<span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-amber-300 px-12 py-2 font-bold text-[10px] text-lime-800 shadow-sm">
				お題
			</span>
			<p className="carved-text text-center font-bold text-lime-800 text-xl xs:text-2xl">
				{theme}
			</p>
		</Tile>
	);
}
