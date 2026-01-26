import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import { useSearchParams } from "react-router";
import { AuthHeader } from "~/components/auth/AuthHeader";
import { Button } from "~/components/button/Button";
import { Pagination } from "~/components/Pagination";
import { Spinner } from "~/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/Tabs";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { RoomCard } from "./components/RoomCard";
import { useRoomListSWR } from "./hooks/useRoomListSWR";

export default function () {
	const [isOpen, setIsOpen] = useState(false);
	const [searchParams, setSearchParams] = useSearchParams();

	const status = (() => {
		const statusParam = searchParams.get("status");
		if (statusParam !== "waiting" && statusParam !== "finished") {
			return "waiting";
		}
		return statusParam;
	})();
	const page = Number(searchParams.get("page")) || 1;

	const { data, error, isLoading, isValidating, mutate } = useRoomListSWR({
		limit: 3,
		page,
		status,
	});

	const meta = data?.meta;

	const getPageUrl = (pageNum: number) => {
		const params = new URLSearchParams();
		params.set("status", status);
		params.set("page", pageNum.toString());
		return `?${params.toString()}`;
	};

	return (
		<>
			<AuthHeader />
			<main className="grid gap-y-16 pb-24">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-lg">部屋一覧</h2>
					<div className="flex gap-x-8">
						<Button
							as="button"
							color="gray"
							disabled={isValidating}
							leftIcon={isValidating ? <Spinner /> : <RxUpdate />}
							onClick={() => mutate()}
							variant="outline"
						>
							更新
						</Button>
						<Button
							as="button"
							leftIcon={<FaPlus />}
							onClick={() => setIsOpen(true)}
						>
							部屋作成
						</Button>
					</div>
				</div>

				<Tabs
					onValueChange={(newStatus: string) =>
						setSearchParams({ status: newStatus })
					}
					value={status}
				>
					<TabsList variant="line">
						<TabsTrigger value="waiting">募集中</TabsTrigger>
						<TabsTrigger value="finished">終了したゲーム</TabsTrigger>
					</TabsList>

					<TabsContent className="mt-16" value="waiting">
						<RoomList
							emptyMessage="現在募集している部屋はありません"
							error={error}
							isLoading={isLoading}
							rooms={status === "waiting" ? data?.items : undefined}
							status="waiting"
						/>
					</TabsContent>

					<TabsContent className="mt-16" value="finished">
						<RoomList
							emptyMessage="終了した部屋はありません"
							error={error}
							isLoading={isLoading}
							rooms={status === "finished" ? data?.items : undefined}
							status="finished"
						/>
					</TabsContent>
				</Tabs>

				{meta && meta.totalPages > 1 && (
					<Pagination
						getPageUrl={getPageUrl}
						page={meta.page}
						totalPages={meta.totalPages}
					/>
				)}
			</main>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}

type RoomListPropsBase = {
	isLoading: boolean;
	error?: Error;
	emptyMessage: string;
};

type WaitingRoomListProps = RoomListPropsBase & {
	status: "waiting";
	rooms?: WaitingRoom[];
};

type FinishedRoomListProps = RoomListPropsBase & {
	status: "finished";
	rooms?: FinishedRoom[];
};

function RoomList({
	rooms,
	status,
	isLoading,
	error,
	emptyMessage,
}: WaitingRoomListProps | FinishedRoomListProps) {
	if (isLoading) {
		return (
			<div className="grid place-items-center gap-y-4 py-16 text-neutral-500">
				<Spinner className="size-32" />
				<p className="text-center">部屋一覧を取得中...</p>
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-red-500">部屋の取得に失敗しました</p>
		);
	}

	if (!rooms || rooms.length === 0) {
		return <p className="py-16 text-center text-neutral-500">{emptyMessage}</p>;
	}

	return (
		<div className="grid gap-y-8">
			{rooms.map((room) => (
				<RoomCard key={room.gameId} room={room} status={status} />
			))}
		</div>
	);
}
