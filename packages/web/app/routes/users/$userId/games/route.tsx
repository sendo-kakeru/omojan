import type { FinishedRoom } from "@repo/db/model";
import type { UserId } from "@repo/db/schema";
import { FiChevronLeft } from "react-icons/fi";
import { RxUpdate } from "react-icons/rx";
import { Link, useSearchParams } from "react-router";
import { Button } from "~/components/button/Button";
import { Header } from "~/components/Header";
import { Pagination } from "~/components/Pagination";
import { useRoomListSWR } from "~/routes/_index/hooks/useRoomListSWR";
import { UserGameList } from "~/routes/users/$userId/_index/components/UserGameSection";
import type { Route } from "./+types/route";

const PER_PAGE = 20;

export default function Page({ params: { userId } }: Route.ComponentProps) {
	const [searchParams] = useSearchParams();
	const page = Number(searchParams.get("page")) || 1;

	const { data, error, isLoading, mutate } = useRoomListSWR({
		limit: PER_PAGE,
		page,
		status: "finished",
		userId: userId as UserId,
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
							aria-label="ユーザーページへ戻る"
							className="flex items-center gap-x-4 text-neutral-500 hover:text-neutral-700"
							to={`/users/${userId}`}
						>
							<FiChevronLeft className="size-20" />
						</Link>
						<h1 className="font-bold text-lg">対戦履歴</h1>
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

				<UserGameList error={error} isLoading={isLoading} rooms={rooms} />

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
