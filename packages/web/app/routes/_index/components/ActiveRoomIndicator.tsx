import classNames from "classnames";

/**
 * 対戦中の部屋の稼働状況を1行で示すインジケーター
 *
 * NOTE: 対戦中の部屋は参加も観戦もできず押せる導線がないため、
 * 押せそうに見えるカードではなくドットと件数だけで表示する
 */
export function ActiveRoomIndicator({
	count,
	isLoading,
}: {
	count?: number;
	isLoading: boolean;
}) {
	// 副次的な情報なので、取得できなかった場合はエラーを出さず場所も取らない
	if (!isLoading && count === undefined) {
		return null;
	}

	const isActive = count !== undefined && count > 0;
	const label = (() => {
		if (isLoading) return "対戦状況を確認中";
		if (isActive) return `${count}部屋が対戦中`;
		return "対戦中の部屋はありません";
	})();

	return (
		<p
			className={classNames(
				"flex items-center gap-x-8 rounded-full border border-ivory-edge bg-ivory/80 px-12 py-4 text-sm",
				isActive ? "font-bold text-moss" : "text-neutral-500",
			)}
			role="status"
		>
			<span className="relative flex size-8">
				{isActive && (
					<span className="absolute inline-flex size-full animate-ping rounded-full bg-moss-light opacity-75 motion-reduce:hidden" />
				)}
				<span
					className={classNames(
						"relative inline-flex size-8 rounded-full",
						isActive ? "bg-moss-light" : "bg-ivory-deep",
					)}
				/>
			</span>
			{label}
		</p>
	);
}
