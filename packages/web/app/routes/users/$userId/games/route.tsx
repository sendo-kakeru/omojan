import type { FinishedRoom } from "@repo/db/models";
import type { UserId } from "@repo/db/schemas";
import { FiChevronLeft } from "react-icons/fi";
import { Link, useSearchParams } from "react-router";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Pagination } from "~/components/Pagination";
import {
	SectionHeading,
	SectionRefreshButton,
} from "~/components/SectionHeading";
import { decodeUuid58Param } from "~/libs/uuid58";
import { useRoomListSWR } from "~/routes/_index/hooks/useRoomListSWR";
import { UserGameList } from "~/routes/users/$userId/_index/components/UserGameSection";
import type { Route } from "./+types/route";

const PER_PAGE = 20;

export default function Page({
	params: { userId: encodedUserId },
}: Route.ComponentProps) {
	const userId = decodeUuid58Param<UserId>(encodedUserId);
	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get("page")) || 1;

	const { data, error, isLoading, mutate } = useRoomListSWR({
		limit: PER_PAGE,
		page,
		status: "finished",
		userId,
	});

	const rooms = data?.items as FinishedRoom[] | undefined;
	const meta = data?.meta;

	const getPageUrl = (pageNum: number): string => {
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
						aria-label="ユーザーページへ戻る"
						className="-m-8 rounded-full p-8 text-neutral-500 transition-colors hover:bg-cream-100 hover:text-neutral-700"
						to={`/users/${encodedUserId}`}
					>
						<FiChevronLeft className="size-20" />
					</Link>
					<div className="flex-1">
						<SectionHeading
							action={<SectionRefreshButton onClick={() => mutate()} />}
							headingTag="h1"
							mark="歴"
						>
							対戦履歴
						</SectionHeading>
					</div>
				</div>

				<UserGameList error={error} isLoading={isLoading} rooms={rooms} />

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
