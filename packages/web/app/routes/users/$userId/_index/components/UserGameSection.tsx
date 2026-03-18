import type { FinishedRoom } from "@repo/db/model";
import type { UserId } from "@repo/db/schema";
import { FiChevronRight } from "react-icons/fi";
import { Button } from "~/components/button/Button";
import { RoomCard } from "~/routes/_index/components/RoomCard";
import { RoomCardSkeleton } from "~/routes/_index/components/RoomCardSkeleton";
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
			<div className="flex items-center justify-between">
				<h2 className="font-bold">対戦履歴</h2>
				{total && total > USER_GAMES_LIMIT && (
					<Button
						as="link"
						rightIcon={<FiChevronRight className="size-16" />}
						to={`/users/${userId}/games`}
						variant="outline"
					>
						もっと見る
					</Button>
				)}
			</div>
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
					<RoomCardSkeleton
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
			<p className="py-16 text-center text-red-400">
				対戦履歴の取得に失敗しました
			</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return (
			<p className="py-16 text-center text-neutral-500">対戦履歴がありません</p>
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
