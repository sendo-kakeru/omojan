import classNames from "classnames";

export function RequiredBadge({ className }: { className?: string }) {
	return (
		<span
			className={classNames(
				"bg-red-50 px-4 text-[0.625rem] text-red-600",
				className,
			)}
		>
			必須
		</span>
	);
}
