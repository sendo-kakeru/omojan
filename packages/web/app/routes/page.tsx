import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "~/components/button/Button";
import { Spinner } from "~/components/Spinner";
import { useGameListSWR } from "~/hooks/useGameListSWR";
import { CreateRoomDialog } from "./_components/CreateRoomDialog";
import { JoinRoomCard } from "./_components/JoinRoomCard";

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
								<JoinRoomCard key={room.gameId} room={room} />
							))}
						</div>
					)}
				</div>
			</div>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
