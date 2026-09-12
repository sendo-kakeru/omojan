import { uuid58Encode } from "@nakanoaas/uuid58";
import type { FinishedRoom } from "@repo/db/model";
import { FaCrown, FaRegClock } from "react-icons/fa6";
import { Link } from "react-router";
import { Tile } from "~/components/Tile";
import { getDisplayName } from "~/libs/displayName";
import { formatDateHyphen, formatRelativeTime } from "~/libs/formatDate";
import { RoomCardAvatar } from "./RoomCardAvatar";
import { ROOM_CARD_ACTION_CLASS_NAME } from "./shared";

/**
 * 完了済みの部屋カード
 */
export function FinishedRoomCard({
	room,
	className,
}: {
	room: FinishedRoom;
	className?: string;
}) {
	return (
		<article className={className}>
			<Tile
				className="relative grid w-full gap-y-8 p-12"
				interactive
				thickness="cream"
			>
				<div className="pointer-events-none grid gap-y-8">
					<div className="flex min-h-28 items-start">
						<h3 className="font-bold text-base text-lime-800">
							<Link
								aria-label={`${room.title}の結果を見る`}
								className={ROOM_CARD_ACTION_CLASS_NAME}
								to={`/game/${uuid58Encode(room.gameId)}/result`}
							>
								{room.title}
							</Link>
						</h3>
					</div>

					<div className="flex items-center gap-x-12 text-neutral-500 text-xs">
						<span className="flex items-center gap-x-4">
							<FaRegClock aria-hidden="true" />
							{room.timeLimit}秒
						</span>
						<time
							className="ml-auto text-neutral-400"
							dateTime={formatDateHyphen(room.finishedAt)}
						>
							{formatRelativeTime(room.finishedAt)}
						</time>
					</div>

					<Players players={room.players} />
				</div>
			</Tile>
		</article>
	);
}

function Players({ players }: { players: FinishedRoom["players"] }) {
	const winners = players.filter((player) => player.isWinner);
	const others = players.filter((player) => !player.isWinner);

	return (
		<div className="grid gap-y-8 sm:flex sm:items-start sm:justify-between sm:gap-x-16">
			<ul className="grid min-w-0 gap-y-6 sm:flex-1">
				{winners.map((player) => (
					<li className="flex items-center gap-x-8" key={player.id}>
						<div className="relative shrink-0">
							<RoomCardAvatar isWinner player={player} />
							<FaCrown
								aria-label="優勝"
								className="absolute -top-8 left-1/2 size-14 -translate-x-1/2 text-amber-500"
								role="img"
							/>
						</div>
						<div className="grid min-w-0 flex-1 gap-y-1">
							<span className="font-bold text-[9px] text-amber-500">優勝</span>
							<span className="overflow-hidden text-ellipsis whitespace-nowrap font-bold text-neutral-700 text-xs">
								{getDisplayName(player.playerName)}
							</span>
						</div>
					</li>
				))}
			</ul>
			{others.length > 0 && (
				<div className="flex shrink-0 items-center gap-x-6">
					<div className="flex items-center">
						{others.map((player) => (
							<RoomCardAvatar
								className="-ml-6 size-20 shadow-[0_0_0_2px_var(--color-cream-50)] first:ml-0"
								key={player.id}
								player={player}
							/>
						))}
					</div>
					<span className="text-[10px] text-neutral-400">
						他{others.length}人
					</span>
				</div>
			)}
		</div>
	);
}
