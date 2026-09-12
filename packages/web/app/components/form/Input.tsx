import classNames from "classnames";

export function Input({
	className,
	type,
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			className={classNames(
				"flex h-36 w-full min-w-0 rounded-md border border-cream-200 bg-cream-50 px-12 py-4 text-base transition-colors md:text-sm",
				"placeholder:text-neutral-500",
				"hover:bg-cream-100/50",
				"disabled:cursor-not-allowed disabled:bg-cream-300/30",
				"focus-visible:border-lime-800",
				"aria-invalid:border-red-600",
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}
