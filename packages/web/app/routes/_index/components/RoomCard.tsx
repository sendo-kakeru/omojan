import { uuid58Encode } from "@nakanoaas/uuid58";
import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import type { PlayerSeat } from "@repo/db/schema";
import classNames from "classnames";
import { useState } from "react";
import { FaCrown, FaRegClock } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { Link } from "react-router";
import { Avatar } from "~/components/Avatar";
import { tileClassName } from "~/components/Tile";
import { formatDateHyphen, formatRelativeTime } from "~/libs/formatDate";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { JoinRoomDialog } from "./JoinRoomDialog";

/** 卓は常に4席。空席も並べて残り席数を一目で分かるようにする */
const SEATS: PlayerSeat[] = [1, 2, 3, 4];

type RoomPlayer = (WaitingRoom | FinishedRoom)["players"][number];

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
	const emptySeatCount = SEATS.length - room.players.length;

	// カード全体をタップ領域にする（::before で敷き、席のリンクだけ手前に出す）
	const cardActionClassName = classNames(
		"pointer-events-auto text-left outline-none before:absolute before:inset-0 before:rounded-lg before:content-['']",
		"focus-visible:before:ring-2 focus-visible:before:ring-brand focus-visible:before:ring-inset",
	);

	return (
		<article
			className={tileClassName({
				className: classNames("relative grid w-full gap-y-8 p-12", className),
				interactive: true,
				stand: isWaiting ? "gold" : "ivory",
			})}
		>
			<div className="pointer-events-none grid gap-y-8">
				<div className="flex min-h-28 items-start justify-between gap-x-8">
					<h3 className="font-bold text-base text-moss">
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
						<IoIosLock
							aria-label="プライベート部屋"
							className="size-20 shrink-0 text-gold-deep"
							role="img"
						/>
					)}
				</div>

				<div className="flex items-center gap-x-12 text-neutral-500 text-xs">
					<span className="flex items-center gap-x-4">
						<FaRegClock aria-hidden="true" />
						{room.timeLimit}秒
					</span>
					{isWaiting && (
						<span
							className={classNames(
								"font-bold",
								emptySeatCount > 0 ? "text-brand-deep" : "text-neutral-500",
							)}
						>
							{emptySeatCount > 0 ? `あと${emptySeatCount}席` : "満席"}
						</span>
					)}
					<time
						className="ml-auto text-neutral-400"
						dateTime={formatDateHyphen(
							isWaiting ? room.createdAt : room.finishedAt,
						)}
					>
						{formatRelativeTime(isWaiting ? room.createdAt : room.finishedAt)}
					</time>
				</div>

				<ul className="grid grid-cols-4 gap-6">
					{SEATS.map((seat) => {
						const player = room.players.find((target) => target.seat === seat);
						return (
							<li className="min-w-0" key={seat}>
								{player ? (
									<SeatOccupied player={player} />
								) : (
									<SeatEmpty seat={seat} />
								)}
							</li>
						);
					})}
				</ul>
			</div>

			{isWaiting && (
				<JoinRoomDialog isOpen={isOpen} room={room} setIsOpen={setIsOpen} />
			)}
		</article>
	);
}

/** 着席済みの席 */
function SeatOccupied({ player }: { player: RoomPlayer }) {
	const isWinner = "isWinner" in player && player.isWinner === true;
	const content = (
		<>
			<div className="relative">
				<Avatar
					name={player.playerName}
					size="S"
					src={buildImageUrl({
						image: player.image,
						size: AVATAR_IMAGE_DIMENSIONS.S,
					})}
				/>
				{isWinner && (
					<FaCrown
						aria-label="勝者"
						className="absolute -top-8 left-1/2 size-14 -translate-x-1/2 text-gold-deep"
						role="img"
					/>
				)}
			</div>
			<p className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-[10px] text-neutral-600">
				{player.playerName}
			</p>
		</>
	);

	const seatClassName = classNames(
		"grid place-items-center gap-y-2 rounded-md border px-4 py-6",
		isWinner
			? "border-gold bg-gold/20 shadow-[0_0_14px_2px_rgb(255_216_72/0.5)]"
			: "border-ivory-edge bg-mat/60",
	);

	if (player.userId) {
		return (
			<Link
				aria-label={`${player.playerName}のプロフィールを見る`}
				className={classNames(
					seatClassName,
					"pointer-events-auto relative z-1 transition-colors hover:bg-brand-soft",
				)}
				to={`/users/${uuid58Encode(player.userId)}`}
			>
				{content}
			</Link>
		);
	}

	return <div className={seatClassName}>{content}</div>;
}

/** 空席 */
function SeatEmpty({ seat }: { seat: PlayerSeat }) {
	return (
		<div className="grid place-items-center gap-y-2 rounded-md border border-ivory-deep border-dashed px-4 py-6">
			<span className="grid size-24 place-items-center rounded-full bg-ivory-edge/60 font-bold text-[10px] text-neutral-400">
				{seat}
			</span>
			<p className="text-[10px] text-neutral-400">空席</p>
		</div>
	);
}
