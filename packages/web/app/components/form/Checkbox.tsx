import classNames from "classnames";
import { useId } from "react";
import { CheckboxInput } from "./CheckboxInput";
import { Label } from "./Label";

export function Checkbox({
	className,
	label,
	disabled,
	hasError,
	...props
}: Omit<React.ComponentProps<"input">, "id" | "type"> & {
	label?: React.ReactNode;
	hasError?: boolean;
}) {
	const id = useId();
	return (
		<div className={classNames("group flex items-center gap-x-8", className)}>
			<CheckboxInput
				aria-invalid={hasError}
				className="shrink-0"
				disabled={disabled}
				id={id}
				{...props}
			/>
			{label && (
				<Label
					className={classNames(
						"shrink-0 text-sm text-neutral-500 group-has-[input:checked]:text-neutral-800 md:text-base",
						!disabled && !hasError && "hover:text-neutral-800",
					)}
					disabled={disabled}
					htmlFor={id}
				>
					{label}
				</Label>
			)}
		</div>
	);
}
