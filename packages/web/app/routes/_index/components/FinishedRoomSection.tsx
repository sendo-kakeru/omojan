import type { FinishedRoom } from "@repo/db/model";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "~/components/button/Button";
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
			<SectionHeader />
			<FinishedRoomList error={error} isLoading={isLoading} rooms={rooms} />
		</section>
	);
}

function SectionHeader() {
	return (
		<div className="flex items-center justify-between">
			<h2 className="font-bold">最近のゲーム</h2>
			<Button
				as="link"
				rightIcon={<FiChevronRight className="size-16" />}
				to="/room/finished"
				variant="outline"
			>
				もっと見る
			</Button>
		</div>
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
			<div className="grid gap-y-8">
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
			<p className="py-16 text-center text-red-400">
				ゲーム履歴の取得に失敗しました
			</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return (
			<p className="py-16 text-center text-neutral-500">
				ゲームが行われていません
			</p>
		);
	}

	return (
		<div className="grid gap-y-8">
			{rooms.map((room) => (
				<RoomCard key={room.gameId} room={room} status="finished" />
			))}
		</div>
	);
}
