import type { WaitingRoom } from "@repo/db/model";
import { OFFICIAL_X_ID } from "@repo/shared/constants/config";
import { IoGameController } from "react-icons/io5";
import { RxUpdate } from "react-icons/rx";
import { Button } from "~/components/button/Button";
import { XFollowButton } from "~/components/button/XFollowButton";
import { RoomCard } from "./RoomCard";
import { RoomCardSkeleton } from "./RoomCardSkeleton";

export function WaitingRoomSection({
	isLoading,
	error,
	rooms,
	onCreateRoom,
	handleRefresh,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: WaitingRoom[];
	onCreateRoom: () => void;
	handleRefresh: () => void;
}) {
	return (
		<section className="grid gap-y-12">
			<SectionHeader
				count={rooms?.length}
				handleRefresh={handleRefresh}
				isLoading={isLoading}
				onCreateRoom={onCreateRoom}
			/>
			<WaitingRoomList error={error} isLoading={isLoading} rooms={rooms} />
		</section>
	);
}

function SectionHeader({
	count,
	isLoading,
	onCreateRoom,
	handleRefresh,
}: {
	count?: number;
	isLoading: boolean;
	onCreateRoom: () => void;
	handleRefresh: () => void;
}) {
	return (
		<div className="flex items-end justify-between">
			<div className="grid gap-y-12">
				<XFollowButton username={OFFICIAL_X_ID} />
				<div className="flex items-center gap-x-8">
					<h2 className="font-bold">募集中の部屋</h2>
					<span className="text-neutral-500 text-xs sm:text-sm">
						( {isLoading || count === undefined ? "読み込み中" : `${count}件`} )
					</span>
				</div>
			</div>
			<div className="flex flex-col gap-y-8 sm:flex-row sm:items-center sm:gap-x-8">
				<Button
					as="button"
					className="ml-auto"
					color="gray"
					leftIcon={<RxUpdate />}
					onClick={handleRefresh}
					variant="outline"
				>
					更新
				</Button>
				<Button
					as="button"
					leftIcon={<IoGameController />}
					onClick={onCreateRoom}
				>
					部屋作成
				</Button>
			</div>
		</div>
	);
}

function WaitingRoomList({
	isLoading,
	error,
	rooms,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: WaitingRoom[];
}) {
	const isEmpty = !rooms || rooms.length === 0;

	if (isLoading) {
		return <RoomCardSkeleton srText="募集中の部屋を取得中" />;
	}

	if (error || isEmpty) {
		return (
			<div className="grid h-150 place-items-center rounded-lg border-2 border-gray-200 border-dashed bg-gray-50 p-24">
				{error ? (
					<p className="text-red-400">部屋の取得に失敗しました</p>
				) : (
					<p className="text-center text-neutral-500 text-sm sm:text-base">
						現在募集している部屋はありません
						<br />
						部屋を作成してみましょう！
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="grid gap-y-8">
			{rooms.map((room) => (
				<RoomCard key={room.gameId} room={room} status="waiting" />
			))}
		</div>
	);
}
