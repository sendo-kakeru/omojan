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
				black: "border-moss bg-moss text-white",
				brand: "border-brand/40 bg-brand-soft text-brand-deep",
				danger: "border-red-200 bg-red-100 text-red-700",
				gold: "border-gold bg-gold/25 text-moss",
				gray: "border-ivory-edge bg-mat text-neutral-600",
				primary: "border-moss/30 bg-moss/10 text-moss",
				warning: "border-gold bg-gold/25 text-moss",
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
		color?:
			| "primary"
			| "danger"
			| "black"
			| "gray"
			| "warning"
			| "brand"
			| "gold";
	}>) {
	return (
		<span className={badgeVariants({ className, color })} {...props}>
			{children}
		</span>
	);
}
