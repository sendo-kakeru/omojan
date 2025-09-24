import classNames from "classnames";
import type { ComponentPropsWithoutRef } from "react";

export function Label({
	className,
	children,
	disabled,
	...props
}: ComponentPropsWithoutRef<"label"> & {
	/** 選択不可か否か */
	disabled?: boolean;
}) {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: 紐付け系の値はpropsで扱っている
		<label
			className={classNames(
				disabled ? "cursor-not-allowed" : "cursor-pointer",
				className,
			)}
			{...props}
		>
			{children}
		</label>
	);
}
