import type { WaitingRoom } from "@repo/db/model";
import {
	DISCORD_INVITE_URL,
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import { IoGameController } from "react-icons/io5";
import { RxUpdate } from "react-icons/rx";
import { Button } from "~/components/button/Button";
import { useShare } from "~/hooks/useShare";
import { RoomCard } from "./RoomCard";
import { RoomCardSkeleton } from "./RoomCardSkeleton";

export function WaitingRoomSection({
	isLoading,
	error,
	rooms,
	onCreateRoom,
	onRefresh,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: WaitingRoom[];
	onCreateRoom: () => void;
	onRefresh: () => void;
}) {
	return (
		<section className="grid gap-y-12">
			<SectionHeader
				count={rooms?.length}
				isLoading={isLoading}
				onCreateRoom={onCreateRoom}
				onRefresh={onRefresh}
			/>
			<WaitingRoomList error={error} isLoading={isLoading} rooms={rooms} />
		</section>
	);
}

function SectionHeader({
	count,
	isLoading,
	onCreateRoom,
	onRefresh,
}: {
	count?: number;
	isLoading: boolean;
	onCreateRoom: () => void;
	onRefresh: () => void;
}) {
	const { share } = useShare({
		text: "一緒に遊ぼう！",
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});

	return (
		<div className="flex items-end justify-between">
			<div className="grid gap-y-40">
				<div className="grid gap-y-6">
					<p className="text-neutral-500 text-xs">募集通知はDiscordから！</p>
					<div className="flex items-center gap-x-8">
						<a
							aria-label="公式Discordサーバー"
							className="rounded-full bg-[#5865F2] p-6 text-white transition-colors hover:bg-[#4752C4]"
							href={DISCORD_INVITE_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaDiscord className="size-20" />
						</a>
						<a
							aria-label="公式X"
							className="rounded-full bg-black p-6 text-white transition-colors hover:bg-gray-700"
							href={`https://x.com/${OFFICIAL_X_ID}`}
							rel="noopener noreferrer"
							target="_blank"
						>
							<FaXTwitter className="size-20" />
						</a>
						<button
							aria-label="友達に共有する"
							className="rounded-full bg-cyan-400 p-6 text-white transition-colors hover:bg-cyan-500"
							onClick={share}
							type="button"
						>
							<IoMdShare className="size-20" />
						</button>
					</div>
				</div>
				<div className="flex items-center gap-x-8">
					<h2 className="font-bold">🎮 募集中の部屋</h2>
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
					onClick={onRefresh}
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
