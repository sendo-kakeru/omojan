import type { FinishedRoom } from "@repo/db/model";
import { FiChevronLeft } from "react-icons/fi";
import { RxUpdate } from "react-icons/rx";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/button/Button";
import { Header } from "~/components/Header";
import { Pagination } from "~/components/Pagination";
import { RoomCard } from "~/routes/_index/components/RoomCard";
import { RoomCardSkeleton } from "~/routes/_index/components/RoomCardSkeleton";
import { useRoomListSWR } from "~/routes/_index/hooks/useRoomListSWR";

const PER_PAGE = 20;

export default function FinishedRoomsPage() {
	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get("page")) || 1;

	const { data, error, isLoading, mutate } = useRoomListSWR({
		limit: PER_PAGE,
		page,
		status: "finished",
	});

	const rooms = data?.items as FinishedRoom[] | undefined;
	const meta = data?.meta;

	const getPageUrl = (pageNum: number) => {
		const params = new URLSearchParams();
		params.set("page", pageNum.toString());
		return `?${params.toString()}`;
	};

	return (
		<>
			<Header />
			<main className="grid gap-y-16 pb-40">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-x-8">
						<Link
							aria-label="トップへ戻る"
							className="flex items-center gap-x-4 text-neutral-500 hover:text-neutral-700"
							to="/"
						>
							<FiChevronLeft className="size-20" />
						</Link>
						<h1 className="font-bold text-lg">過去のゲーム</h1>
					</div>
					<Button
						as="button"
						color="gray"
						leftIcon={<RxUpdate />}
						onClick={() => mutate()}
						variant="outline"
					>
						更新
					</Button>
				</div>

				<FinishedRoomList error={error} isLoading={isLoading} rooms={rooms} />

				{meta && meta.totalPages > 1 && (
					<Pagination
						getPageUrl={getPageUrl}
						page={meta.page}
						totalPages={meta.totalPages}
					/>
				)}
			</main>
		</>
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
						srText={index === 0 ? "過去のゲームを取得中" : undefined}
					/>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-red-400">
				ゲームの取得に失敗しました
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
