import classNames from "classnames";
import type { CSSProperties } from "react";
import { Tile } from "~/components/Tile";

/**
 * 装飾の牌
 */
const DECOR_TILES = [
	{
		char: "言",
		charClassName: "text-lime-800",
		rotate: "-8deg",
		thickness: "lime",
	},
	{
		char: "笑",
		charClassName: "text-orange-600",
		rotate: "6deg",
		thickness: "amber",
	},
	{
		char: "遊",
		charClassName: "text-orange-600",
		rotate: "-3deg",
		thickness: "orange",
	},
] as const;

/** 装飾の牌を1枚ずつずらして揺らす間隔 */
const DECOR_TILE_STAGGER_MS = 280;

/**
 * ホームのタイトルエリア
 */
export function HomeTitle() {
	return (
		<div className="grid place-items-center gap-y-12 sm:gap-y-20">
			<ul aria-hidden="true" className="flex items-end gap-x-10">
				{DECOR_TILES.map((tile, index) => (
					<li key={tile.char}>
						<Tile
							className="grid size-44 xs:size-52 animate-tile-float place-items-center motion-reduce:animate-none"
							style={
								{
									"--tile-rotate": tile.rotate,
									animationDelay: `${index * DECOR_TILE_STAGGER_MS}ms`,
								} as CSSProperties
							}
							thickness={tile.thickness}
						>
							<span
								className={classNames(
									"carved-text font-bold text-xl xs:text-2xl",
									tile.charClassName,
								)}
							>
								{tile.char}
							</span>
						</Tile>
					</li>
				))}
			</ul>

			<h1 className="grid gap-y-6">
				<span className="embossed-text font-display text-4xl xs:text-5xl">
					おもじゃん
				</span>
				<span className="font-display text-lime-800 text-sm xs:text-lg tracking-[0.4em]">
					オンライン
				</span>
			</h1>
		</div>
	);
}
