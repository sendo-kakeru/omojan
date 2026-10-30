import classNames from "classnames";
import type { ComponentPropsWithoutRef } from "react";

export function LineSigninButton({
	children,
	className,
	...props
}: ComponentPropsWithoutRef<"button">) {
	return (
		<button
			{...props}
			className={classNames(
				"group relative flex h-40 cursor-pointer items-center overflow-hidden rounded-[5px] border border-transparent bg-[#06C755] text-[15px] font-bold whitespace-nowrap text-white transition-colors",
				"before:pointer-events-none before:absolute before:-inset-1 before:bg-black before:opacity-0 before:transition-opacity before:duration-150",
				"not-disabled:hover:before:opacity-10",
				"not-disabled:focus:before:opacity-30 not-disabled:active:before:opacity-30",
				"disabled:cursor-default disabled:border-[rgba(229,229,229,0.6)] disabled:bg-white disabled:before:hidden",
				className,
			)}
		>
			<img
				alt="LINE"
				className="block h-full shrink-0 border-r border-black/8 p-8 group-disabled:opacity-20"
				height={38}
				src="/icons/line.webp"
				width={41}
			/>
			<span className="flex-1 overflow-hidden px-20 text-center text-ellipsis group-disabled:text-[rgba(30,30,30,0.2)]">
				{children}
			</span>
		</button>
	);
}
