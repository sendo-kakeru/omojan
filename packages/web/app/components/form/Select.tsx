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
}: React.ComponentProps<"select"> & {
	placeholder?: string;
	withPlaceholder?: boolean;
}) {
	return (
		<div className="relative flex w-fit">
			<select
				className={classNames(
					"size-full cursor-pointer appearance-none truncate rounded-sm border border-cream-200 bg-cream-50 py-4 pr-40 pl-16 text-base transition-colors",
					"invalid:text-neutral-500", // 未選択時（一つ目の要素選択時）に文字色を変える
					"hover:bg-cream-100/50",
					"focus-visible:border-lime-800",
					"aria-invalid:border-red-600 aria-invalid:bg-red-500/5 aria-invalid:text-neutral-500",
					"disabled:cursor-not-allowed disabled:bg-cream-300/30 disabled:text-neutral-500",
					className,
				)}
				disabled={disabled}
				required={required}
				{...props}
			>
				{withPlaceholder && (
					<option value="">
						{/* biome-ignore lint/nursery/useNullishCoalescing: 空文字の場合もデフォルト文言を表示する */}
						{placeholder || "選択してください"}
					</option>
				)}
				{children}
			</select>
			<FaAngleDown
				aria-hidden
				className="pointer-events-none absolute top-1/2 right-16 size-16 shrink-0 -translate-y-1/2 text-neutral-400"
			/>
		</div>
	);
}
