import { uuid58Encode } from "@nakanoaas/uuid58";
import type { FinishedRoom } from "@repo/db/models";
import classNames from "classnames";
import type { ReactNode } from "react";
import { FaCrown, FaRegClock } from "react-icons/fa6";
import { Link } from "react-router";
import { Tile } from "~/components/Tile";
import { getDisplayName } from "~/libs/displayName";
import { formatDateHyphen, formatRelativeTime } from "~/libs/formatDate";
import { RoomCardAvatar } from "./RoomCardAvatar";
import { ROOM_CARD_ACTION_CLASS_NAME } from "./shared";

type FinishedRoomPlayer = FinishedRoom["players"][number];

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
						<h3 className="text-base font-bold text-lime-800">
							<Link
								aria-label={`${room.title}の結果を見る`}
								className={ROOM_CARD_ACTION_CLASS_NAME}
								to={`/game/${uuid58Encode(room.gameId)}/result`}
							>
								{room.title}
							</Link>
						</h3>
					</div>

					<div className="flex items-center gap-x-12 text-xs text-neutral-500">
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

/**
 * ユーザーが紐づくプレイヤーだけ、ユーザーページへのリンクにする
 */
function MaybeUserProfileLink({
	player,
	className,
	children,
}: {
	player: FinishedRoomPlayer;
	className?: string;
	children: ReactNode;
}) {
	if (!player.userId) {
		return <div className={className}>{children}</div>;
	}

	const displayName = getDisplayName(player.playerName);
	const label = player.isWinner
		? `${displayName}（優勝）のプロフィールを見る`
		: `${displayName}のプロフィールを見る`;

	return (
		<Link
			aria-label={label}
			className={classNames(
				"pointer-events-auto relative transition-[background-color,opacity]",
				"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-800",
				className,
			)}
			to={`/users/${uuid58Encode(player.userId)}`}
		>
			{children}
		</Link>
	);
}

function Players({ players }: { players: FinishedRoom["players"] }) {
	const winners = players.filter((player) => player.isWinner);
	const others = players.filter((player) => !player.isWinner);

	return (
		<div className="grid gap-y-8 sm:flex sm:items-end sm:justify-between sm:gap-x-16">
			<ul className="grid min-w-0 gap-y-6 sm:flex-1">
				{winners.map((player) => (
					<li className="flex min-w-0" key={player.id}>
						<MaybeUserProfileLink
							className="-m-4 flex min-w-0 flex-1 items-center gap-x-8 rounded-lg p-4 hover:bg-cream-100"
							player={player}
						>
							<div className="relative shrink-0">
								<RoomCardAvatar isWinner player={player} />
								<FaCrown
									aria-label="優勝"
									className="absolute -top-8 left-1/2 size-14 -translate-x-1/2 text-amber-500"
									role="img"
								/>
							</div>
							<div className="grid min-w-0 flex-1 gap-y-1">
								<span className="text-[9px] font-bold text-amber-500">
									優勝
								</span>
								<span className="overflow-hidden text-xs font-bold text-ellipsis whitespace-nowrap text-neutral-700">
									{getDisplayName(player.playerName)}
								</span>
							</div>
						</MaybeUserProfileLink>
					</li>
				))}
			</ul>
			{others.length > 0 && (
				<ul className="-mx-2 flex shrink-0 items-center">
					{others.map((player) => (
						<li className="-ml-6 flex first:ml-0" key={player.id}>
							<MaybeUserProfileLink
								className="rounded-full p-2 hover:opacity-80"
								player={player}
							>
								<RoomCardAvatar
									className="shadow-[0_0_0_2px_var(--color-cream-50)]"
									player={player}
								/>
							</MaybeUserProfileLink>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
