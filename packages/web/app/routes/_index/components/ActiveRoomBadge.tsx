import classNames from "classnames";

/**
 * 対戦中の部屋の稼働状況を1行で示すインジケーター
 */
export function ActiveRoomBadge({
	count,
	isLoading,
}: {
	count: number;
	isLoading: boolean;
}) {
	const isActive = count > 0;
	const label = (() => {
		if (isLoading) return "対戦状況を確認中";
		if (isActive) return `${count}部屋が対戦中`;
		return "対戦中の部屋はありません";
	})();

	return (
		<p
			className={classNames(
				"flex w-fit items-center gap-x-8 rounded-full border border-cream-200 bg-cream-50/80 px-12 py-4 text-sm",
				isActive ? "font-bold text-lime-800" : "text-neutral-500",
			)}
			role="status"
		>
			<span className="relative flex size-8">
				{isActive && (
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-600 opacity-75 motion-reduce:hidden" />
				)}
				<span
					className={classNames(
						"relative inline-flex size-8 rounded-full",
						isActive ? "bg-lime-600" : "bg-cream-300",
					)}
				/>
			</span>
			{label}
		</p>
	);
}
