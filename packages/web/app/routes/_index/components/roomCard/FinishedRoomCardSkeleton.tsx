import type { ComponentProps } from "react";
import { Tile } from "~/components/Tile";

/**
 * 完了済みの部屋カードのスケルトン
 */
export function FinishedRoomCardSkeleton({
	srText,
	...props
}: ComponentProps<"div"> & {
	srText?: string;
}) {
	return (
		<Tile
			className="grid animate-pulse gap-y-8 p-12"
			thickness="cream"
			{...props}
		>
			{srText && <span className="sr-only">{srText}</span>}

			{/* 部屋名 */}
			<div className="flex min-h-28 items-start">
				<div className="h-20 w-160 rounded-full bg-cream-200" />
			</div>

			{/* 制限時間・経過時間 */}
			<div className="flex min-h-16 items-center gap-x-12">
				<div className="h-14 w-56 rounded-full bg-cream-200" />
				<div className="ml-auto h-14 w-56 rounded-full bg-cream-200" />
			</div>

			{/* 勝者と、その他のプレイヤー */}
			<div className="grid gap-y-8 sm:flex sm:items-start sm:justify-between sm:gap-x-16">
				<div className="flex min-w-0 items-center gap-x-8 sm:flex-1">
					<div className="size-24 shrink-0 rounded-full bg-cream-200" />
					<div className="grid min-h-30 content-center gap-y-1">
						<div className="h-9 w-24 rounded-full bg-cream-200" />
						<div className="h-14 w-96 rounded-full bg-cream-200" />
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-x-6">
					<div className="flex items-center">
						{[1, 2, 3].map((seat) => (
							<div
								className="-ml-6 size-20 shrink-0 rounded-full bg-cream-200 shadow-[0_0_0_2px_var(--color-cream-50)] first:ml-0"
								key={seat}
							/>
						))}
					</div>
					<div className="h-12 w-32 rounded-full bg-cream-200" />
				</div>
			</div>
		</Tile>
	);
}
