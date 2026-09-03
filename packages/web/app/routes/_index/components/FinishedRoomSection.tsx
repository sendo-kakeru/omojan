import type { FinishedRoom } from "@repo/db/model";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "~/components/button/Button";
import { SectionHeading } from "~/components/SectionHeading";
import { RoomCard } from "./RoomCard";
import { RoomCardSkeleton } from "./RoomCardSkeleton";

export function FinishedRoomSection({
	isLoading,
	error,
	rooms,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: FinishedRoom[];
}) {
	return (
		<section className="grid gap-y-12">
			<SectionHeading
				action={
					<Button
						as="link"
						className="shrink-0"
						color="gray"
						rightIcon={<FiChevronRight className="size-16" />}
						size="S"
						to="/room/finished"
						variant="outline"
					>
						もっと見る
					</Button>
				}
				mark="果"
			>
				最近のゲーム
			</SectionHeading>
			<FinishedRoomList error={error} isLoading={isLoading} rooms={rooms} />
		</section>
	);
}

function FinishedRoomList({
	isLoading,
	error,
	rooms,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: FinishedRoom[];
}) {
	if (isLoading) {
		return (
			<div className="grid gap-y-12">
				{Array.from({ length: 5 }).map((_, index) => (
					<RoomCardSkeleton
						// biome-ignore lint/suspicious/noArrayIndexKey: ローディングのため問題ない
						key={index}
						srText={index === 0 ? "最近のゲームを取得中" : undefined}
					/>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-brand-deep text-sm">
				ゲーム履歴の取得に失敗しました
			</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return (
			<p className="py-16 text-center text-neutral-500 text-sm">
				まだゲームが行われていません
			</p>
		);
	}

	return (
		<div className="grid gap-y-12">
			{rooms.map((room, index) => (
				<div
					className="animate-rise motion-reduce:animate-none"
					key={room.gameId}
					style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
				>
					<RoomCard room={room} status="finished" />
				</div>
			))}
		</div>
	);
}
