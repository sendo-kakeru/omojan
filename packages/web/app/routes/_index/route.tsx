import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import { useSearchParams } from "react-router";
import { AuthHeader } from "~/components/auth/AuthHeader";
import { Button } from "~/components/button/Button";
import { XFollowButton } from "~/components/button/XFollowButton";
import { Pagination } from "~/components/Pagination";
import { Spinner } from "~/components/Spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/Tabs";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { RoomCard } from "./components/RoomCard";
import { RoomCardSkeleton } from "./components/RoomCardSkeleton";
import { useRoomListSWR } from "./hooks/useRoomListSWR";

export default function () {
	const [isOpen, setIsOpen] = useState(false);
	const [searchParams, setSearchParams] = useSearchParams();

	const limit = Number(searchParams.get("limit")) ?? 20;
	const page = Number(searchParams.get("page")) ?? 1;
	const status = (() => {
		const statusParam = searchParams.get("status");
		if (statusParam !== "waiting" && statusParam !== "finished") {
			return "waiting";
		}
		return statusParam;
	})();

	const { data, error, isLoading, isValidating, mutate } = useRoomListSWR({
		limit,
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
			<main className="grid gap-y-8 pb-24">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-lg">部屋一覧</h2>
					<XFollowButton
						options={{ lang: "ja", showScreenName: false, size: "large" }}
						username="omojan_online"
					/>
				</div>

				<Tabs
					onValueChange={(newStatus: string) =>
						setSearchParams({ status: newStatus })
					}
					value={status}
				>
					<div className="flex">
						<TabsList variant="line">
							<TabsTrigger value="waiting">募集中</TabsTrigger>
							<TabsTrigger value="finished">過去履歴</TabsTrigger>
						</TabsList>
						<div className="ml-auto flex gap-x-4 sm:gap-x-8">
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
					<TabsContent className="mt-12" value="waiting">
						<RoomList
							emptyMessage="現在募集している部屋はありません"
							error={error}
							isLoading={isLoading}
							rooms={
								status === "waiting"
									? (data?.items as WaitingRoom[] | undefined)
									: undefined
							}
							status="waiting"
						/>
					</TabsContent>

					<TabsContent className="mt-12" value="finished">
						<RoomList
							emptyMessage="終了した部屋はありません"
							error={error}
							isLoading={isLoading}
							rooms={
								status === "finished"
									? (data?.items as FinishedRoom[] | undefined)
									: undefined
							}
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
	isLoading,
	error,
	emptyMessage,
	...props
}: WaitingRoomListProps | FinishedRoomListProps) {
	if (isLoading) {
		return (
			<div className="grid gap-y-8">
				{Array.from({ length: props.status === "waiting" ? 1 : 4 }).map(
					(_, index) => (
						<RoomCardSkeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: ローディングのため問題ない
							key={index}
							srText={index === 0 ? "部屋一覧を取得中" : undefined}
						/>
					),
				)}
			</div>
		);
	}

	if (error) {
		return (
			<p className="py-16 text-center text-red-500">部屋の取得に失敗しました</p>
		);
	}

	if (!props.rooms || props.rooms.length === 0) {
		return <p className="py-16 text-center text-neutral-500">{emptyMessage}</p>;
	}

	if (props.status === "waiting") {
		return (
			<div className="grid gap-y-8">
				{props.rooms.map((room) => (
					<RoomCard key={room.gameId} room={room} status="waiting" />
				))}
			</div>
		);
	}

	return (
		<div className="grid gap-y-8">
			{props.rooms.map((room) => (
				<RoomCard key={room.gameId} room={room} status="finished" />
			))}
		</div>
	);
}
