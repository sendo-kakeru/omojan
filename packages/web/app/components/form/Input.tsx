import classNames from "classnames";

export function Input({
	className,
	type,
	...props
}: React.ComponentProps<"input">) {
	return (
		<input
			className={classNames(
				"flex h-36 w-full min-w-0 rounded-md border border-gray-200 bg-white px-12 py-4 text-base transition-colors md:text-sm",
				"placeholder:text-neutral-500",
				"hover:bg-gray-50",
				"disabled:cursor-not-allowed disabled:bg-gray-100",
				"focus-visible:border-gray-400",
				"aria-invalid:border-red-600",
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}
