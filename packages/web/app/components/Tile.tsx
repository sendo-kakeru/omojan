import type { ComponentProps } from "react";
import { tv } from "tailwind-variants";

/**
 * 麻雀牌のスタイル
 *
 * キービジュアル（public/ogp.png）の牌をUIの基本単位として再現する。
 * 台座（牌の厚みの色）を stand で切り替える。
 *
 * 要素の種類はコンポーネントごとに異なる（div / button / li）ため、
 * ポリモーフィックなコンポーネントにせずクラス生成関数として公開している
 */
export const tileClassName = tv(
	{
		base: "tile",
		compoundVariants: [
			{
				class:
					"hover:-translate-y-2 hover:shadow-tile-lift active:translate-y-1 active:shadow-tile-press",
				interactive: true,
			},
		],
		defaultVariants: {
			stand: "ivory",
		},
		variants: {
			interactive: {
				false: "",
				true: "cursor-pointer transition-[transform,box-shadow] duration-150 ease-out",
			},
			stand: {
				brand: "[--tile-base:var(--color-brand-deep)]",
				gold: "[--tile-base:var(--color-gold-deep)]",
				ivory: "[--tile-base:var(--color-ivory-deep)]",
				moss: "[--tile-base:var(--color-moss)]",
			},
		},
	},
	{ twMerge: false },
);

/**
 * 牌（装飾・表示用）
 *
 * 手札のように操作対象になる場合は tileClassName を button に当てる
 */
export function Tile({
	className,
	stand = "ivory",
	interactive = false,
	children,
	...props
}: ComponentProps<"div"> & {
	stand?: "ivory" | "gold" | "moss" | "brand";
	interactive?: boolean;
}) {
	return (
		<div
			className={tileClassName({ className, interactive, stand })}
			{...props}
		>
			{children}
		</div>
	);
}
