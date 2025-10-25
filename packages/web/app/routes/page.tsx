import classNames from "classnames";
import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { FaRegClock } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { IoIosLock } from "react-icons/io";
import { Button } from "~/components/button/Button";
import { Spinner } from "~/components/Spinner";
import { UserLabel } from "~/components/user/UserLabel";
import { useGameListSWR } from "~/hooks/useGameListSWR";
import { CreateRoomDialog } from "./_components/CreateRoomDialog";

export default function () {
	const [isOpen, setIsOpen] = useState(false);
	const { data, error, isLoading } = useGameListSWR();
	const gameList = data?.data;

	return (
		<>
			<div className="grid gap-y-16">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-lg">募集中の部屋一覧</h2>
					<Button
						as="button"
						className="w-fit justify-self-end"
						leftIcon={<FaPlus />}
						onClick={() => setIsOpen(true)}
					>
						部屋作成
					</Button>
				</div>

				<div className="grid gap-y-8">
					{isLoading && (
						<div className="grid place-items-center gap-y-4 py-16 text-gray-500">
							<Spinner className="size-32" />
							<p className="text-center">部屋一覧を取得中...</p>
						</div>
					)}

					{error && (
						<p className="py-16 text-center text-red-500">
							部屋の取得に失敗しました
						</p>
					)}

					{gameList && gameList.length === 0 && (
						<p className="py-16 text-center text-gray-500">
							現在募集している部屋はありません
						</p>
					)}

					{gameList && (
						<div className="grid gap-y-8">
							{gameList.map((room) => (
								<button
									aria-label={`${room.title}に参加`}
									className={classNames(
										"grid gap-y-12 rounded-lg border border-gray-300 bg-white p-12 shadow-sm transition-colors",
										"hover:border-gray-400 hover:bg-gray-50",
									)}
									key={room.gameId}
									onClick={() => {
										// TODO: 参加用JWTトークン取得後、ルームへ遷移
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
							))}
						</div>
					)}
				</div>
			</div>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
