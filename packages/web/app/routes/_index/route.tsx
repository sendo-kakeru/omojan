import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { RxUpdate } from "react-icons/rx";
import { AuthHeader } from "~/components/auth/AuthHeader";
import { Button } from "~/components/button/Button";
import { Spinner } from "~/components/Spinner";
import { useRoomListSWR } from "~/routes/_index/hooks/useRoomListSWR";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { RoomCard } from "./components/RoomCard";

// TODO: タブ切り替え、ページネーション
export default function () {
	const [isOpen, setIsOpen] = useState(false);
	const { data, error, isLoading, isValidating, mutate } = useRoomListSWR();
	const gameList = data?.data?.items;

	return (
		<>
			<AuthHeader />
			<main className="grid gap-y-16">
				<div className="flex items-center justify-between">
					<h2 className="font-bold text-lg">募集中の部屋一覧</h2>
					<div className="flex gap-x-8">
						<Button
							as="button"
							color="gray"
							disabled={isValidating}
							leftIcon={isValidating ? <Spinner /> : <RxUpdate />}
							onClick={() => mutate()}
							variant="outline"
						>
							更新
						</Button>
						<Button
							as="button"
							leftIcon={<FaPlus />}
							onClick={() => setIsOpen(true)}
						>
							部屋作成
						</Button>
					</div>
				</div>

				<div className="grid gap-y-8">
					{isLoading && (
						<div className="grid place-items-center gap-y-4 py-16 text-neutral-500">
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
						<p className="py-16 text-center text-neutral-500">
							現在募集している部屋はありません
						</p>
					)}

					{gameList && (
						<div className="grid gap-y-8">
							{gameList.map((room) => (
								<RoomCard key={room.gameId} room={room} status="waiting" />
							))}
						</div>
					)}
				</div>
			</main>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
