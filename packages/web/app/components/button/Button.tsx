import classNames from "classnames";
import type { ReactNode } from "react";
import type { LinkProps, To } from "react-router";
import { Link } from "react-router";
import { tv } from "tailwind-variants";

type ShareProps = {
	className?: string;
	color?: "primary" | "danger" | "black" | "gray";
	variant?: "fill" | "outline";
	rightIcon?: ReactNode;
	leftIcon?: ReactNode;
	isIconOnly?: boolean;
	"aria-label"?: string;
	size?: "S" | "M" | "L";
	children?: ReactNode;
};

type ButtonProps = ShareProps &
	React.ComponentPropsWithRef<"button"> & {
		as: "button";
	};

type AnchorProps = ShareProps &
	LinkProps & {
		as: "link";
		to: To;
	};

const buttonVariants = tv(
	{
		base: classNames(
			"pointer-events-auto inline-flex h-fit shrink-0 items-center justify-center gap-x-4 rounded-full font-medium transition-colors",
			"disabled:cursor-not-allowed disabled:border-none disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-50",
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

			// fill
			{
				class: "bg-green-400 text-white hover:bg-green-500",
				color: "primary",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-red-500 text-white hover:bg-red-600",
				color: "danger",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-gray-700 text-white hover:bg-gray-900",
				color: "black",
				disabled: false,
				variant: "fill",
			},
			{
				class: "bg-gray-300 text-white hover:bg-gray-400",
				color: "gray",
				disabled: false,
				variant: "fill",
			},

			// outline
			{
				class:
					"border-1 border-green-400 bg-white text-green-400 hover:bg-green-100",
				color: "primary",
				disabled: false,
				variant: "outline",
			},
			{
				class: "border-1 border-red-500 bg-white text-red-500 hover:bg-red-100",
				color: "danger",
				disabled: false,
				variant: "outline",
			},
			{
				class:
					"border-1 border-gray-700 bg-white text-gray-700 hover:bg-gray-200",
				color: "black",
				disabled: false,
				variant: "outline",
			},
			{
				class:
					"border-1 border-gray-300 bg-white text-gray-500 hover:bg-gray-200",
				color: "gray",
				disabled: false,
				variant: "outline",
			},
		],
		variants: {
			color: {
				black: "",
				danger: "",
				gray: "",
				primary: "",
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
		base: "flex size-20 shrink-0 items-center justify-center",
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
}: ButtonProps | AnchorProps) {
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

	const contentClassName = contentVariants({
		isIconOnly,
		size,
		variant,
	});

	const iconClassName = iconVariants();

	const content = (
		<>
			{leftIcon && (
				<span aria-disabled={disabled} className={iconClassName}>
					{leftIcon}
				</span>
			)}
			<span className={contentClassName}>{children}</span>
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
