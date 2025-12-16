import type { Game } from "@repo/db/model";
import classNames from "classnames";
import { useState } from "react";
import { FaRegClock } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { IoIosLock } from "react-icons/io";
import { UserLabel } from "~/components/user/UserLabel";
import { JoinRoomDialog } from "./JoinRoomDialog";

export function JoinRoomCard({
	room,
	className,
}: {
	room: Omit<Game, "password">;
	className?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				aria-label={`${room.title}に参加`}
				className={classNames(
					"grid gap-y-12 rounded-lg border border-gray-300 bg-white p-12 shadow-sm transition-colors",
					"hover:border-gray-400 hover:bg-gray-50",
					className,
				)}
				onClick={() => {
					setIsOpen(true);
				}}
				type="button"
			>
				<div className="grid gap-y-4">
					<div className="flex min-h-34 items-center justify-between gap-x-6">
						<h3 className="font-semibold">{room.title}</h3>
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

					<div className="flex items-center gap-x-4 text-gray-500">
						<FaRegClock />
						<p className="text-sm">制限時間: {room.timeLimit}秒</p>
					</div>

					<div className="flex items-center gap-x-4 text-gray-500">
						<FiUsers />
						<p className="text-sm">参加者: {room.players.length}/4</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-x-16 gap-y-8">
					{room.players.map((player) => (
						<UserLabel
							avatarProps={{ size: "S" }}
							key={player.id}
							textProps={{ className: "text-xs" }}
							user={{
								image: player.image,
								name: player.playerName,
							}}
						/>
					))}
				</div>
			</button>
			<JoinRoomDialog isOpen={isOpen} room={room} setIsOpen={setIsOpen} />
		</>
	);
}
