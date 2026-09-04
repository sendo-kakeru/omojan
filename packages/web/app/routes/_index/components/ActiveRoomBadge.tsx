import classNames from "classnames";

const activeRoomBadgeClassName =
	"flex w-fit items-center gap-x-6 rounded-full border px-12 py-6 text-xs";

export function ActiveRoomBadge({
	isLoading,
	count,
}: {
	isLoading: boolean;
	count: number;
}) {
	if (isLoading) {
		return (
			<p
				className="flex h-30 w-87 animate-pulse rounded-full bg-neutral-200"
				role="status"
			>
				<span className="sr-only">対戦中の部屋を取得中</span>
			</p>
		);
	}

	const hasRooms = count > 0;

	if (!hasRooms) {
		return (
			<p
				className={classNames(
					activeRoomBadgeClassName,
					"border-neutral-200 bg-neutral-100 text-neutral-400",
				)}
				role="status"
			>
				<span
					aria-hidden="true"
					className="size-6 rounded-full bg-neutral-300"
				/>
				対戦中の部屋はありません
			</p>
		);
	}

	return (
		<p
			className={classNames(
				activeRoomBadgeClassName,
				"border-orange-200 bg-orange-50 font-semibold text-orange-600",
			)}
			role="status"
		>
			<span
				aria-hidden="true"
				className="size-6 animate-pulse rounded-full bg-orange-500"
			/>
			対戦中 {count}
		</p>
	);
}
