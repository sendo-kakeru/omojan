import type { FinishedRoom } from "@repo/db/models";
import { FiChevronLeft } from "react-icons/fi";
import { Link, useSearchParams } from "react-router";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Pagination } from "~/components/Pagination";
import {
	SectionHeading,
	SectionRefreshButton,
} from "~/components/SectionHeading";
import { FinishedRoomCard } from "~/routes/_index/components/room-card/FinishedRoomCard";
import { FinishedRoomCardSkeleton } from "~/routes/_index/components/room-card/FinishedRoomCardSkeleton";
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
		<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
			<Header />
			<main className="grid content-start gap-y-16 pb-40">
				<div className="flex items-center gap-x-8">
					<Link
						aria-label="トップへ戻る"
						className="rounded-full text-neutral-500 transition-colors hover:bg-cream-100 hover:text-neutral-700"
						to="/"
					>
						<FiChevronLeft className="size-24" />
					</Link>
					<div className="flex-1">
						<SectionHeading
							action={<SectionRefreshButton onClick={() => mutate()} />}
							headingTag="h1"
							mark="歴"
						>
							過去のゲーム
						</SectionHeading>
					</div>
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
			<Footer />
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
					<FinishedRoomCardSkeleton
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
			<p className="py-16 text-center text-sm text-orange-700">
				ゲームの取得に失敗しました
			</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return (
			<p className="py-16 text-center text-sm text-neutral-500">
				ゲームが行われていません
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
