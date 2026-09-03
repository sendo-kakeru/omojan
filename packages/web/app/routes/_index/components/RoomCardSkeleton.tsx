import type { ComponentProps } from "react";
import { tileClassName } from "~/components/Tile";

/**
 * 部屋カードのスケルトン
 *
 * 実カードと同じ牌の外形・4席のグリッドを保ち、
 * 読み込み完了時にレイアウトが動かないようにする
 */
export function RoomCardSkeleton({
	srText,
	...props
}: ComponentProps<"div"> & {
	srText?: string;
}) {
	return (
		<div
			className={tileClassName({
				className: "grid animate-pulse gap-y-8 p-12",
			})}
			{...props}
		>
			{srText && <span className="sr-only">{srText}</span>}
			<div className="flex min-h-28 items-start">
				<div className="h-20 w-160 rounded-full bg-ivory-edge" />
			</div>
			<div className="flex gap-x-12">
				<div className="h-14 w-56 rounded-full bg-ivory-edge" />
				<div className="h-14 w-48 rounded-full bg-ivory-edge" />
			</div>
			<div className="grid grid-cols-4 gap-6">
				{[1, 2, 3, 4].map((seat) => (
					<div
						className="grid place-items-center gap-y-2 rounded-md border border-ivory-edge px-4 py-6"
						key={seat}
					>
						<div className="size-24 rounded-full bg-ivory-edge" />
						<div className="h-10 w-32 rounded-full bg-ivory-edge" />
					</div>
				))}
			</div>
		</div>
	);
}
