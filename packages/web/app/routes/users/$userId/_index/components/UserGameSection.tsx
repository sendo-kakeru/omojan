import { uuid58Encode } from "@nakanoaas/uuid58";
import type { FinishedRoom } from "@repo/db/models";
import type { UserId } from "@repo/db/schemas";
import { SectionHeading, SectionMoreLink } from "~/components/SectionHeading";
import { FinishedRoomCard } from "~/routes/_index/components/room-card/FinishedRoomCard";
import { FinishedRoomCardSkeleton } from "~/routes/_index/components/room-card/FinishedRoomCardSkeleton";
import { USER_GAMES_LIMIT } from "../constants";

export function UserGameSection({
	userId,
	isLoading,
	error,
	rooms,
	total,
}: {
	userId: UserId;
	isLoading: boolean;
	error?: Error;
	rooms?: FinishedRoom[];
	total?: number;
}) {
	return (
		<section className="grid gap-y-12">
			<SectionHeading
				action={
					total !== undefined && total > USER_GAMES_LIMIT ? (
						<SectionMoreLink to={`/users/${uuid58Encode(userId)}/games`} />
					) : undefined
				}
				mark="歴"
			>
				対戦履歴
			</SectionHeading>
			<UserGameList error={error} isLoading={isLoading} rooms={rooms} />
		</section>
	);
}

export function UserGameList({
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
					<FinishedRoomCardSkeleton
						// biome-ignore lint/suspicious/noArrayIndexKey: ローディングのため問題ない
						key={index}
						srText={index === 0 ? "対戦履歴を取得中" : undefined}
					/>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-sm text-orange-700">
				対戦履歴の取得に失敗しました
			</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return (
			<p className="py-16 text-center text-sm text-neutral-500">
				対戦履歴がありません
			</p>
		);
	}

	return (
		<div className="grid gap-y-8">
			{rooms.map((room) => (
				<FinishedRoomCard key={room.gameId} room={room} />
			))}
		</div>
	);
}
