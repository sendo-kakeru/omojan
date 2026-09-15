import classNames from "classnames";
import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

/**
 * 麻雀牌のスタイル
 */
const tileVariants = tv(
	{
		base: "tile transition-[translate,box-shadow] duration-200 ease-out",
		defaultVariants: {
			thickness: "cream",
		},
		variants: {
			interactive: {
				false: "",
				/**
				 * NOTE: 要素の上昇によりホバーが外れたりするのでafterで元のホバー位置のアクションを残しておく
				 */
				true: classNames(
					"relative cursor-pointer",
					"hover:tile-lift hover:-translate-y-4",
					// active:duration-75指定により、押し込みと戻りで速度を変える
					"active:tile-press active:translate-y-3 active:duration-75",
					"after:absolute after:inset-x-0 after:top-full after:h-0 after:content-[''] hover:after:h-4",
				),
			},
			/**
			 * 選択中など、ホバーを外しても持ち上がっている状態。ホバーと同じ見た目
			 */
			raised: {
				false: "",
				true: "tile-lift -translate-y-4",
			},
			/**
			 * 牌を横から見たときの厚み（側面）の色
			 *
			 * - amber:  注目・操作できる（現在ページ / 募集中 / 勝者 / 選べる手札）
			 * - cream:  不活性・既定（他ページ / 終了済み / 非勝者 / 使用済みの手札）
			 * - lime:   確定・選択済み（提出確定 / 選択中の手札 / 投票済み）
			 * - orange: アクセント（前後バッジなど、状態ではなく強調のため）
			 */
			thickness: {
				amber: "[--tile-thickness:var(--color-amber-500)]",
				cream: "[--tile-thickness:var(--color-cream-300)]",
				lime: "[--tile-thickness:var(--color-lime-800)]",
				orange: "[--tile-thickness:var(--color-orange-700)]",
			},
		},
	},
	{ twMerge: false },
);

export function Tile({
	className,
	thickness = "cream",
	...props
}: VariantProps<typeof tileVariants> &
	(
		| (ComponentProps<"div"> & {
				as?: "div";
		  })
		| (ComponentProps<"button"> & {
				as: "button";
		  })
		| (ComponentProps<"span"> & {
				as: "span";
		  })
	)) {
	if (props.as === "button") {
		const {
			as: _as,
			disabled,
			interactive = !disabled,
			raised = false,
			...rest
		} = props;
		return (
			<button
				className={tileVariants({ className, interactive, raised, thickness })}
				disabled={disabled}
				type="button"
				{...rest}
			/>
		);
	}

	if (props.as === "span") {
		const { as: _as, interactive = false, raised = false, ...rest } = props;
		return (
			<span
				className={tileVariants({ className, interactive, raised, thickness })}
				{...rest}
			/>
		);
	}

	const { as: _as, interactive = false, raised = false, ...rest } = props;
	return (
		<div
			className={tileVariants({ className, interactive, raised, thickness })}
			{...rest}
		/>
	);
}
