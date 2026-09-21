import type { ComponentProps } from "react";
import { Tile } from "~/components/Tile";

/**
 * 募集中の部屋カードのスケルトン
 */
export function WaitingRoomCardSkeleton({
	srText,
	...props
}: ComponentProps<"div"> & {
	srText?: string;
}) {
	return (
		<Tile
			className="grid animate-pulse gap-y-8 p-12"
			thickness="amber"
			{...props}
		>
			{srText && <span className="sr-only">{srText}</span>}

			{/* 部屋名 */}
			<div className="flex min-h-28 items-start">
				<div className="h-20 w-160 rounded-full bg-cream-200" />
			</div>

			{/* 制限時間・空席・経過時間 */}
			<div className="flex min-h-16 items-center gap-x-12">
				<div className="h-14 w-56 rounded-full bg-cream-200" />
				<div className="h-14 w-48 rounded-full bg-cream-200" />
				<div className="ml-auto h-14 w-56 rounded-full bg-cream-200" />
			</div>

			{/* 参加者のアイコンと人数 */}
			<div className="flex items-center justify-between gap-x-8">
				<div className="flex items-center">
					{[1, 2, 3, 4].map((seat) => (
						<div
							className="-ml-10 size-32 shrink-0 rounded-full bg-cream-200 shadow-[0_0_0_2px_var(--color-cream-50)] first:ml-0"
							key={seat}
						/>
					))}
				</div>
				<div className="h-14 w-40 rounded-full bg-cream-200" />
			</div>
		</Tile>
	);
}
