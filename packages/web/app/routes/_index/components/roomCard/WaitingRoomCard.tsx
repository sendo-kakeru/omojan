import type { WaitingRoom } from "@repo/db/model";
import classNames from "classnames";
import { useState } from "react";
import { FaRegClock } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { Tile } from "~/components/Tile";
import { formatDateHyphen, formatRelativeTime } from "~/libs/formatDate";
import { JoinRoomDialog } from "../JoinRoomDialog";
import { RoomCardAvatar } from "./RoomCardAvatar";
import { ROOM_CARD_ACTION_CLASS_NAME } from "./shared";

const MAX_SEATS = 4;

/**
 * 募集中の部屋カード
 */
export function WaitingRoomCard({
	room,
	className,
}: {
	room: WaitingRoom;
	className?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const emptySeatCount = MAX_SEATS - room.players.length;

	return (
		<article className={className}>
			<Tile
				className="relative grid w-full gap-y-8 p-12"
				interactive
				thickness="amber"
			>
				<div className="pointer-events-none grid gap-y-8">
					<div className="flex min-h-28 items-start justify-between gap-x-8">
						<h3 className="font-bold text-base text-lime-800">
							<button
								aria-label={`${room.title}に参加`}
								className={ROOM_CARD_ACTION_CLASS_NAME}
								onClick={() => setIsOpen(true)}
								type="button"
							>
								{room.title}
							</button>
						</h3>
						{room.isPrivate && (
							<IoIosLock
								aria-label="プライベート部屋"
								className="size-20 shrink-0 text-amber-500"
								role="img"
							/>
						)}
					</div>

					<div className="flex items-center gap-x-12 text-neutral-500 text-xs">
						<span className="flex items-center gap-x-4">
							<FaRegClock aria-hidden="true" />
							{room.timeLimit}秒
						</span>
						<span
							className={classNames(
								"font-bold",
								emptySeatCount > 0 ? "text-orange-700" : "text-neutral-500",
							)}
						>
							{emptySeatCount > 0 ? `あと${emptySeatCount}席` : "満席"}
						</span>
						<time
							className="ml-auto text-neutral-400"
							dateTime={formatDateHyphen(room.createdAt)}
						>
							{formatRelativeTime(room.createdAt)}
						</time>
					</div>

					<Seats emptySeatCount={emptySeatCount} players={room.players} />
				</div>

				<JoinRoomDialog isOpen={isOpen} room={room} setIsOpen={setIsOpen} />
			</Tile>
		</article>
	);
}

/**
 * 参加者/空席を表すアバター一覧
 */
function Seats({
	players,
	emptySeatCount,
}: {
	players: WaitingRoom["players"];
	emptySeatCount: number;
}) {
	return (
		<div className="flex items-center justify-between gap-x-8">
			<div className="flex items-center">
				{players.map((player) => (
					<RoomCardAvatar
						className="-ml-10 shadow-[0_0_0_2px_var(--color-cream-50)] first:ml-0"
						key={player.id}
						player={player}
						size="M"
					/>
				))}
				{Array.from({ length: emptySeatCount }, (_, index) => (
					<div
						className="-ml-10 size-32 shrink-0 rounded-full border-2 border-cream-300 border-dashed bg-transparent first:ml-0"
						// biome-ignore lint/suspicious/noArrayIndexKey: 空席は入れ替わらない固定枠なので問題ない
						key={index}
					/>
				))}
			</div>
			<span className="text-neutral-500 text-xs">
				<span className="font-bold text-lime-900">{players.length}</span>/
				{MAX_SEATS}人
			</span>
		</div>
	);
}
