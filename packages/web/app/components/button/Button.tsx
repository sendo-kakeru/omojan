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

const variants = tv(
	{
		compoundVariants: [
			// アイコンのみ
			{
				class: { base: "p-6", content: "size-12" },
				isIconOnly: true,
				size: "S",
			},
			{
				class: { base: "p-8", content: "size-16" },
				isIconOnly: true,
				size: "M",
			},
			{
				class: { base: "p-10", content: "size-16" },
				isIconOnly: true,
				size: "L",
			},

			// 右アイコンあり
			{
				class: { base: "pr-8" },
				hasRightIcon: true,
				size: "S",
			},
			{
				class: { base: "pr-12" },
				hasRightIcon: true,
				size: "M",
			},
			{
				class: { base: "pr-16" },
				hasRightIcon: true,
				size: "L",
			},

			// 左アイコンあり
			{
				class: { base: "pl-8" },
				hasLeftIcon: true,
				size: "S",
			},
			{
				class: { base: "pl-12" },
				hasLeftIcon: true,
				size: "M",
			},
			{
				class: { base: "pl-16" },
				hasLeftIcon: true,
				size: "L",
			},

			// アイコン無し
			{
				class: { base: "px-12 py-2", content: "text-xs leading-20" },
				isIconOnly: false,
				size: "S",
			},
			{
				class: { base: "px-16 py-4", content: "text-sm leading-24" },
				isIconOnly: false,
				size: "M",
			},
			{
				class: { base: "px-20 py-4", content: "text-base leading-28" },
				isIconOnly: false,
				size: "L",
			},

			// fill
			{
				class: { base: "bg-green-400 hover:bg-green-500" },
				color: "primary",
				disabled: false,
				variant: "fill",
			},
			{
				class: { base: "bg-red-500 hover:bg-red-600" },
				color: "danger",
				disabled: false,
				variant: "fill",
			},
			{
				class: { base: "bg-gray-700 hover:bg-gray-900" },
				color: "black",
				disabled: false,
				variant: "fill",
			},
			{
				class: { base: "bg-gray-300 hover:bg-gray-400" },
				color: "gray",
				disabled: false,
				variant: "fill",
			},

			// outline
			{
				class: { base: "border-green-400 text-green-400 hover:bg-green-100" },
				color: "primary",
				disabled: false,
				variant: "outline",
			},
			{
				class: { base: "border-red-500 text-red-500 hover:bg-red-100" },
				color: "danger",
				disabled: false,
				variant: "outline",
			},
			{
				class: { base: "border-gray-700 text-gray-700 hover:bg-gray-200" },
				color: "black",
				disabled: false,
				variant: "outline",
			},
			{
				class: { base: "border-gray-300 text-gray-500 hover:bg-gray-200" },
				color: "gray",
				disabled: false,
				variant: "outline",
			},
		],
		slots: {
			base: classNames(
				"pointer-events-auto inline-flex h-fit shrink-0 items-center justify-center gap-x-4 rounded-full font-medium transition-colors",
				"disabled:cursor-not-allowed disabled:border-none disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-50",
			),
			content: "flex shrink-0 items-center justify-center",
			icon: "flex size-20 shrink-0 items-center justify-center",
		},
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
				true: { base: "size-fit justify-center" },
			},
			size: {
				L: "",
				M: "",
				S: "",
			},
			variant: {
				fill: { base: "text-white", content: "font-bold" },
				outline: { base: "border-1 bg-white" },
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
}: ButtonProps | AnchorProps) {
	const disabled = props.as === "link" ? false : (props.disabled ?? false);
	const {
		base: baseVariants,
		content: contentVariants,
		icon: iconVariants,
	} = variants({
		color,
		disabled,
		hasLeftIcon: !!leftIcon,
		hasRightIcon: !!rightIcon,
		isIconOnly,
		size,
		variant,
	});
	const buttonClassName = baseVariants({ className });

	const content = (
		<>
			{leftIcon && (
				<span aria-disabled={disabled} className={iconVariants()}>
					{leftIcon}
				</span>
			)}
			<span className={contentVariants()}>{children}</span>
			{rightIcon && (
				<span aria-disabled={disabled} className={iconVariants()}>
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
