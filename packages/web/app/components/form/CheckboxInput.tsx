import classNames from "classnames";
import type { ComponentProps } from "react";
import { FaCheck } from "react-icons/fa6";

export function CheckboxInput({
	className,
	...props
}: ComponentProps<"input">) {
	return (
		<div className="relative size-20">
			<input
				className={classNames(
					"peer absolute inset-0 cursor-pointer appearance-none rounded-sm border border-cream-200 transition-colors",
					"disabled:cursor-not-allowed disabled:bg-cream-300/30",
					"hover:not-checked:not-disabled:bg-cream-100/50",
					"aria-invalid:border-red-600 aria-invalid:bg-red-500/5 aria-invalid:text-neutral-500",
					"size-full focus-visible:border-lime-800",
					className,
				)}
				type="checkbox"
				{...props}
			/>
			<FaCheck
				aria-hidden
				className="pointer-events-none hidden size-full rounded-sm bg-lime-800 p-2 text-white peer-checked:block"
			/>
		</div>
	);
}
