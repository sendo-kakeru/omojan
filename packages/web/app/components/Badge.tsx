import type { PropsWithChildren } from "react";
import { tv } from "tailwind-variants";

const badgeVariants = tv(
	{
		base: "inline-flex w-fit shrink-0 items-center overflow-hidden whitespace-nowrap rounded-full border px-8 py-2 font-medium text-xs transition-colors",
		defaultVariants: {
			color: "primary",
		},
		variants: {
			color: {
				black: "border-gray-900 bg-gray-900 text-white",
				danger: "border-red-200 bg-red-100 text-red-700",
				gray: "border-gray-200 bg-gray-100 text-neutral-700",
				primary: "border-green-200 bg-green-100 text-green-700",
			},
		},
	},
	{ twMerge: false },
);

export function Badge({
	children,
	color = "primary",
	className,
	...props
}: React.ComponentProps<"span"> &
	PropsWithChildren<{
		color?: "primary" | "danger" | "black" | "gray";
	}>) {
	return (
		<span className={badgeVariants({ className, color })} {...props}>
			{children}
		</span>
	);
}
