import classNames from "classnames";
import type { CSSProperties } from "react";
import { IoGameController } from "react-icons/io5";
import { Button } from "~/components/button/Button";
import { tileClassName } from "~/components/Tile";
import { ActiveRoomIndicator } from "./ActiveRoomIndicator";

/**
 * 装飾の牌
 *
 * キービジュアル（public/ogp.png）で卓のまわりに散っている牌を再現する。
 * 読み上げには不要なので aria-hidden で隠す
 */
const DECOR_TILES = [
	{ char: "言", charClassName: "text-moss", rotate: "-8deg", stand: "moss" },
	{ char: "葉", charClassName: "text-brand", rotate: "6deg", stand: "gold" },
	{ char: "笑", charClassName: "text-brand", rotate: "-3deg", stand: "brand" },
] as const;

/**
 * ホームのヒーロー
 *
 * NOTE: 以前は h1 が sr-only でブランドの顔が画面上に無く、
 * 最上部の一番目立つ位置を SNS ボタンが占めていた。
 * ロゴタイプ・公式タグライン・主要CTA をここに集約して、
 * 「何のサイトで、まず何をすればいいか」を先頭で示す
 */
export function HomeHero({
	activeRoomCount,
	isActiveLoading = false,
	onCreateRoom,
}: {
	/** 対戦中の部屋数（未取得なら表示しない） */
	activeRoomCount?: number;
	isActiveLoading?: boolean;
	onCreateRoom: () => void;
}) {
	return (
		<section className="grid animate-rise place-items-center gap-y-16 pt-16 pb-8 text-center sm:gap-y-20 sm:pt-24">
			<ul aria-hidden="true" className="flex items-end gap-x-10">
				{DECOR_TILES.map((tile, index) => (
					<li
						className={tileClassName({
							className:
								"grid size-44 xs:size-52 animate-tile-float place-items-center motion-reduce:animate-none",
							stand: tile.stand,
						})}
						key={tile.char}
						style={
							{
								"--tile-rotate": tile.rotate,
								animationDelay: `${index * 280}ms`,
							} as CSSProperties
						}
					>
						<span
							className={classNames(
								"font-bold text-carved text-xl xs:text-2xl",
								tile.charClassName,
							)}
						>
							{tile.char}
						</span>
					</li>
				))}
			</ul>

			<h1 className="grid gap-y-8">
				<span className="font-display text-4xl text-logo xs:text-5xl">
					おもじゃん
				</span>
				<span className="font-display text-moss text-xs xs:text-sm tracking-[0.4em]">
					オンライン
				</span>
			</h1>

			{/* キービジュアルと同じ公式タグライン */}
			<p className="font-bold text-base text-moss xs:text-lg">
				言葉をつなげて笑いをとれ！
			</p>

			<Button
				as="button"
				className="relative overflow-hidden"
				color="brand"
				leftIcon={<IoGameController />}
				onClick={onCreateRoom}
				size="L"
			>
				部屋をつくる
				{/* CTA を横切る光沢。押せることを静止状態でも伝える */}
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/25 motion-reduce:hidden"
				/>
			</Button>

			<ActiveRoomIndicator
				count={activeRoomCount}
				isLoading={isActiveLoading}
			/>
		</section>
	);
}
