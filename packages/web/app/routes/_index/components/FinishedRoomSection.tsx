import type { FinishedRoom } from "@repo/db/model";
import { SectionHeading, SectionMoreLink } from "~/components/SectionHeading";
import { STAGGER_STEP_MS } from "~/libs/animation";
import { FinishedRoomCard } from "./room-card/FinishedRoomCard";
import { FinishedRoomCardSkeleton } from "./room-card/FinishedRoomCardSkeleton";

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
				action={<SectionMoreLink to="/room/finished" />}
				mark="歴"
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
					<FinishedRoomCardSkeleton
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
			<p className="py-16 text-center text-orange-700 text-sm">
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

	return <FinishedRoomListItems rooms={rooms} />;
}

/**
 * 一覧に増えた部屋だけ登場演出(rise)が走る
 */
function FinishedRoomListItems({ rooms }: { rooms: FinishedRoom[] }) {
	return (
		<div className="grid gap-y-12">
			{rooms.map((room, index) => (
				<div
					className="animate-rise motion-reduce:animate-none"
					key={room.gameId}
					style={{ animationDelay: `${index * STAGGER_STEP_MS}ms` }}
				>
					<FinishedRoomCard room={room} />
				</div>
			))}
		</div>
	);
}
