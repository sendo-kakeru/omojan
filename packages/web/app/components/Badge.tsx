import { tv, type VariantProps } from "tailwind-variants";

const badgeVariants = tv(
	{
		base: "inline-flex w-fit shrink-0 items-center overflow-hidden rounded-full border px-8 py-2 text-xs font-medium whitespace-nowrap transition-colors",
		compoundVariants: [
			{
				class: "border-lime-800/30 bg-lime-800/10 text-lime-800",
				color: "primary",
				variant: "soft",
			},
			{
				class: "border-cream-200 bg-cream-100 text-neutral-600",
				color: "cream",
				variant: "soft",
			},
			{
				class: "border-transparent bg-lime-800 text-white",
				color: "primary",
				variant: "fill",
			},
			{
				// NOTE: 使用箇所が無い組み合わせ。新しい見た目を増やさないよう
				// cream×softと同じにしてある。使うときに設計すること
				class: "border-cream-200 bg-cream-100 text-neutral-600",
				color: "cream",
				variant: "fill",
			},
		],
		defaultVariants: {
			color: "primary",
			variant: "soft",
		},
		variants: {
			color: {
				cream: "",
				primary: "",
			},
			variant: {
				fill: "",
				soft: "",
			},
		},
	},
	{ twMerge: false },
);

export function Badge({
	children,
	color = "primary",
	variant = "soft",
	className,
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return (
		<span className={badgeVariants({ className, color, variant })} {...props}>
			{children}
		</span>
	);
}
