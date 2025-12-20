import classNames from "classnames";
import { FaAngleDown } from "react-icons/fa6";

export function Select({
	className,
	placeholder,
	withPlaceholder = true,
	disabled = false,
	required = true,
	children,
	...props
}: React.ComponentPropsWithRef<"select"> & {
	placeholder?: string;
	withPlaceholder?: boolean;
}) {
	return (
		<div className="relative flex w-fit">
			<select
				className={classNames(
					"size-full cursor-pointer appearance-none overflow-hidden text-ellipsis whitespace-nowrap rounded-sm border border-gray-200 py-4 pr-40 pl-16 text-base transition-colors",
					"invalid:text-gray-500", // 未選択時（一つ目の要素選択時）に文字色を変える
					"hover:bg-gray-50",
					"focus-visible:border-gray-400",
					"aria-invalid:border-red-600 aria-invalid:bg-red-500/5 aria-invalid:text-gray-500",
					"disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
					className,
				)}
				disabled={disabled}
				required={required}
				{...props}
			>
				{withPlaceholder && (
					<option value="">{placeholder || "選択してください"}</option>
				)}
				{children}
			</select>
			<FaAngleDown
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-16 size-16 shrink-0 -translate-y-1/2 text-gray-400"
			/>
		</div>
	);
}
