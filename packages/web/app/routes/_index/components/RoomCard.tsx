import { uuid58Encode } from "@nakanoaas/uuid58";
import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import classNames from "classnames";
import { useState } from "react";
import { FaCrown, FaRegClock } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { IoIosLock } from "react-icons/io";
import { Link } from "react-router";
import { UserLabel } from "~/components/user/UserLabel";
import { formatDateHyphen, formatRelativeTime } from "~/libs/formatDate";
import { JoinRoomDialog } from "./JoinRoomDialog";

export function RoomCard({
	status,
	room,
	className,
}:
	| {
			status: "waiting";
			room: WaitingRoom;
			className?: string;
	  }
	| {
			status: "finished";
			room: FinishedRoom;
			className?: string;
	  }) {
	const [isOpen, setIsOpen] = useState(false);
	const isWaiting = status === "waiting";

	const cardActionClassName = classNames(
		"pointer-events-auto text-left outline-none before:absolute before:inset-0 before:rounded-lg before:content-['']",
		"focus-visible:before:ring-2 focus-visible:before:ring-blue-500 focus-visible:before:ring-inset",
	);

	return (
		<article
			className={classNames(
				"relative grid w-full rounded-lg border border-gray-300 bg-white p-12 shadow-sm transition-colors",
				"hover:bg-gray-50",
				className,
			)}
		>
			<div className="pointer-events-none grid gap-y-4">
				<div className="flex min-h-34 items-center justify-between gap-x-6">
					<h3 className="font-semibold">
						{isWaiting ? (
							<button
								aria-label={`${room.title}に参加`}
								className={cardActionClassName}
								onClick={() => setIsOpen(true)}
								type="button"
							>
								{room.title}
							</button>
						) : (
							<Link
								aria-label={`${room.title}の結果を見る`}
								className={cardActionClassName}
								to={`/game/${uuid58Encode(room.gameId)}/result`}
							>
								{room.title}
							</Link>
						)}
					</h3>
					{room.isPrivate && (
						<div className="rounded-full border border-gray-300 bg-gray-100 p-4">
							<IoIosLock
								aria-label="プライベート部屋"
								className="size-24 text-green-400"
								role="img"
							/>
						</div>
					)}
				</div>
				<div className="flex gap-x-24">
					<div className="flex items-center gap-x-4 text-neutral-500">
						<FaRegClock />
						<p className="text-sm">制限時間 - {room.timeLimit}秒</p>
					</div>

					{isWaiting && (
						<div className="flex items-center gap-x-4 text-neutral-500">
							<FiUsers />
							<p className="text-sm">参加者 - {room.players.length}/4</p>
						</div>
					)}
				</div>
			</div>
			<ul className="pointer-events-none mt-12 flex flex-wrap gap-x-8">
				{room.players.map((player) => {
					const isWinner =
						!isWaiting && "isWinner" in player && player.isWinner;
					const itemClassName = classNames(
						"flex items-center gap-x-4 py-4 pr-12 pl-8",
						isWinner && "rounded-full border-2 border-yellow-400 bg-yellow-50",
					);
					const playerContent = (
						<>
							{isWinner && <FaCrown className="size-16 text-yellow-500" />}
							<UserLabel
								avatarProps={{ size: "S" }}
								textProps={{ className: "text-xs" }}
								user={{
									image: player.image,
									name: player.playerName,
								}}
							/>
						</>
					);
					return (
						<li key={player.id}>
							{player.userId ? (
								<Link
									aria-label={`${player.playerName}のプロフィールを見る`}
									className={classNames(
										itemClassName,
										"pointer-events-auto relative z-1 rounded-full transition-colors hover:bg-gray-100",
									)}
									to={`/users/${uuid58Encode(player.userId)}`}
								>
									{playerContent}
								</Link>
							) : (
								<div className={itemClassName}>{playerContent}</div>
							)}
						</li>
					);
				})}
			</ul>
			<time
				className="mt-6 w-full text-right text-neutral-400 text-xs"
				dateTime={formatDateHyphen(
					isWaiting ? room.createdAt : room.finishedAt,
				)}
			>
				{isWaiting
					? formatRelativeTime(room.createdAt)
					: formatRelativeTime(room.finishedAt)}
			</time>
			{isWaiting && (
				<JoinRoomDialog isOpen={isOpen} room={room} setIsOpen={setIsOpen} />
			)}
		</article>
	);
}
