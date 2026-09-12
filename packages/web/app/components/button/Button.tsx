import classNames from "classnames";
import type { ReactNode } from "react";
import type { LinkProps, To } from "react-router";
import { Link } from "react-router";
import { tv } from "tailwind-variants";

type ShareProps = {
	className?: string;
	/**
	 * - primary: その画面の主アクション
	 * - secondary: 主アクションに次ぐ導線
	 * - danger: 退出・削除など取り消しにくい操作
	 * - gray: キャンセルなど、主アクションからはっきり下げたい操作（無彩色）
	 * - cream: 地に馴染ませたい補助操作（暖色。アイコンボタンなど）
	 */
	color?: "primary" | "secondary" | "danger" | "gray" | "cream";
	variant?: "fill" | "outline";
	rightIcon?: ReactNode;
	leftIcon?: ReactNode;
	isIconOnly?: boolean;
	"aria-label"?: string;
	size?: "S" | "M" | "L" | "XL";
	children?: ReactNode;
};

type ButtonProps = ShareProps &
	React.ComponentProps<"button"> & {
		as: "button";
	};

export type AnchorButtonProps = ShareProps &
	LinkProps & {
		as: "link";
		to: To;
	};

const buttonVariants = tv(
	{
		base: classNames(
			"pointer-events-auto inline-flex h-fit shrink-0 items-center justify-center gap-x-4 rounded-full font-medium transition-colors",
			"disabled:cursor-not-allowed disabled:border-none disabled:bg-gray-300 disabled:text-neutral-500 disabled:opacity-50",
		),
		compoundVariants: [
			// アイコンのみ
			{
				class: "size-fit justify-center p-6",
				isIconOnly: true,
				size: "S",
			},
			{
				class: "size-fit justify-center p-8",
				isIconOnly: true,
				size: "M",
			},
			{
				class: "size-fit justify-center p-10",
				isIconOnly: true,
				size: "L",
			},
			{
				class: "size-fit justify-center p-12",
				isIconOnly: true,
				size: "XL",
			},

			// 右アイコンあり
			{
				class: "pr-8",
				hasRightIcon: true,
				size: "S",
			},
			{
				class: "pr-12",
				hasRightIcon: true,
				size: "M",
			},
			{
				class: "pr-16",
				hasRightIcon: true,
				size: "L",
			},
			{
				class: "pr-20",
				hasRightIcon: true,
				size: "XL",
			},

			// 左アイコンあり
			{
				class: "pl-8",
				hasLeftIcon: true,
				size: "S",
			},
			{
				class: "pl-12",
				hasLeftIcon: true,
				size: "M",
			},
			{
				class: "pl-16",
				hasLeftIcon: true,
				size: "L",
			},
			{
				class: "pl-20",
				hasLeftIcon: true,
				size: "XL",
			},

			// アイコン無し
			{
				class: "px-12 py-2",
				isIconOnly: false,
				size: "S",
			},
			{
				class: "px-16 py-4",
				isIconOnly: false,
				size: "M",
			},
			{
				class: "px-20 py-4",
				isIconOnly: false,
				size: "L",
			},
			{
				class: "px-28 py-10",
				isIconOnly: false,
				size: "XL",
			},

			// fill
			// 牌(Tile)と同じく立体的に見せる
			{
				class: classNames(
					"relative bg-orange-700 text-white shadow-[inset_0_1px_0_var(--color-orange-600),0_4px_0_var(--color-orange-900),0_10px_16px_-6px_rgb(90_20_0/0.28)]",
					// NOTE: transformではなくtranslate。Tailwind v4のtranslate-*は
					// translateプロパティを吐くため、transformでは補間されない
					"duration-200 ease-out [transition-property:translate,box-shadow,background-color]",
					"after:absolute after:inset-x-0 after:top-full after:h-0 after:content-[''] hover:after:h-4",
					"hover:-translate-y-4 hover:shadow-[inset_0_1px_0_var(--color-orange-600),0_8px_0_var(--color-orange-900),0_20px_30px_-10px_rgb(90_20_0/0.35)]",
					"active:translate-y-3 active:bg-orange-800 active:shadow-[inset_0_1px_0_var(--color-orange-600),0_1px_0_var(--color-orange-900),0_3px_6px_-3px_rgb(90_20_0/0.3)] active:duration-75",
				),
				color: "primary",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-lime-800 text-white hover:bg-lime-900",
				color: "secondary",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-red-700 text-white hover:bg-red-700/85",
				color: "danger",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-gray-300 text-neutral-600 hover:bg-gray-400",
				color: "gray",
				disabled: false,
				variant: "fill",
			},
			{
				// NOTE: 使用箇所が無い組み合わせ。新しい見た目を増やさないよう
				// cream×outlineと同じにしてある。使うときに設計すること
				class:
					"border border-cream-300 bg-cream-50 text-neutral-500 hover:bg-cream-100",
				color: "cream",
				disabled: false,
				variant: "fill",
			},

			// outline
			{
				class:
					"border border-orange-700 bg-cream-50 text-orange-700 hover:bg-orange-700/10",
				color: "primary",
				disabled: false,
				variant: "outline",
			},
			{
				class:
					"border border-lime-800 bg-cream-50 text-lime-800 hover:bg-lime-800/10",
				color: "secondary",
				disabled: false,
				variant: "outline",
			},
			{
				class:
					"border border-red-700 bg-cream-50 text-red-700 hover:bg-red-700/10",
				color: "danger",
				disabled: false,
				variant: "outline",
			},
			{
				// NOTE: 使用箇所が無い組み合わせ。新しい見た目を増やさないよう
				// gray×fillと同じにしてある。使うときに設計すること
				class: "bg-gray-300 text-neutral-600 hover:bg-gray-400",
				color: "gray",
				disabled: false,
				variant: "outline",
			},
			{
				class:
					"border border-cream-300 bg-cream-50 text-neutral-500 hover:bg-cream-100",
				color: "cream",
				disabled: false,
				variant: "outline",
			},
		],
		variants: {
			color: {
				cream: "",
				danger: "",
				gray: "",
				primary: "",
				secondary: "",
			},
			disabled: { false: "", true: "" },
			hasLeftIcon: { false: "", true: "" },
			hasRightIcon: { false: "", true: "" },
			isIconOnly: {
				false: "",
				true: "",
			},
			size: {
				L: "",
				M: "",
				S: "",
				XL: "",
			},
			variant: {
				fill: "",
				outline: "",
			},
		},
	},
	{ twMerge: false },
);

const contentVariants = tv(
	{
		base: "flex shrink-0 items-center justify-center",
		compoundVariants: [
			{
				class: "size-12",
				isIconOnly: true,
				size: "S",
			},
			{
				class: "size-16",
				isIconOnly: true,
				size: "M",
			},
			{
				class: "size-16",
				isIconOnly: true,
				size: "L",
			},
			{
				class: "size-20",
				isIconOnly: true,
				size: "XL",
			},
			{
				class: "text-xs leading-20",
				isIconOnly: false,
				size: "S",
			},
			{
				class: "text-sm leading-24",
				isIconOnly: false,
				size: "M",
			},
			{
				class: "text-base leading-28",
				isIconOnly: false,
				size: "L",
			},
			{
				class: "text-lg leading-32",
				isIconOnly: false,
				size: "XL",
			},
		],
		variants: {
			isIconOnly: {
				false: "",
				true: "",
			},
			size: {
				L: "",
				M: "",
				S: "",
				XL: "",
			},
			variant: {
				fill: "font-bold",
				outline: "",
			},
		},
	},
	{ twMerge: false },
);

const iconVariants = tv(
	{
		base: "flex shrink-0 items-center justify-center",
		variants: {
			size: {
				L: "size-20",
				M: "size-20",
				S: "size-20",
				XL: "size-24",
			},
		},
	},
	{ twMerge: false },
);

export function Button({
	className,
	color = "primary",
	variant = "fill",
	size = "M",
	isIconOnly,
	leftIcon,
	rightIcon,
	"aria-label": ariaLabel,
	children,
	...props
}: ButtonProps | AnchorButtonProps) {
	const disabled = props.as === "link" ? false : (props.disabled ?? false);

	const buttonClassName = buttonVariants({
		className,
		color,
		disabled,
		hasLeftIcon: !!leftIcon,
		hasRightIcon: !!rightIcon,
		isIconOnly,
		size,
		variant,
	});

	const iconClassName = iconVariants({ size });

	const content = (
		<>
			{leftIcon && (
				<span aria-disabled={disabled} className={iconClassName}>
					{leftIcon}
				</span>
			)}
			<span
				className={contentVariants({
					isIconOnly,
					size,
					variant,
				})}
			>
				{children}
			</span>
			{rightIcon && (
				<span aria-disabled={disabled} className={iconClassName}>
					{rightIcon}
				</span>
			)}
		</>
	);

	if (props.as === "link") {
		// as 属性が渡らないようにする
		const { as: _, type: __, ...rest } = props;
		return (
			<Link className={buttonClassName} title={ariaLabel} {...rest}>
				{content}
			</Link>
		);
	}

	// as 属性が渡らないようにする
	// type prop が必須ではない分、ここでデフォルト値 `button` を指定する
	const { as: _, type = "button", ...rest } = props;
	return (
		<button
			aria-label={ariaLabel}
			type={type}
			{...rest}
			className={buttonClassName}
		>
			{content}
		</button>
	);
}
