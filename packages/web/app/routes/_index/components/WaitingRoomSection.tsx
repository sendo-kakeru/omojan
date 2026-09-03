import type { WaitingRoom } from "@repo/db/model";
import { IoGameController } from "react-icons/io5";
import { RxUpdate } from "react-icons/rx";
import { Button } from "~/components/button/Button";
import { SectionHeading } from "~/components/SectionHeading";
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
			<SectionHeading
				action={
					<div className="flex shrink-0 items-center gap-x-8">
						<Button
							aria-label="部屋一覧を更新"
							as="button"
							color="gray"
							isIconOnly
							onClick={onRefresh}
							size="S"
							variant="outline"
						>
							<RxUpdate />
						</Button>
						<Button
							as="button"
							color="brand"
							leftIcon={<IoGameController />}
							onClick={onCreateRoom}
							size="S"
							variant="outline"
						>
							部屋作成
						</Button>
					</div>
				}
				count={
					isLoading || rooms === undefined ? "読み込み中" : `${rooms.length}件`
				}
				mark="卓"
			>
				募集中の部屋
			</SectionHeading>
			<WaitingRoomList
				error={error}
				isLoading={isLoading}
				onCreateRoom={onCreateRoom}
				rooms={rooms}
			/>
		</section>
	);
}

function WaitingRoomList({
	isLoading,
	error,
	rooms,
	onCreateRoom,
}: {
	isLoading: boolean;
	error?: Error;
	rooms?: WaitingRoom[];
	onCreateRoom: () => void;
}) {
	if (isLoading) {
		return <RoomCardSkeleton srText="募集中の部屋を取得中" />;
	}

	if (error) {
		return (
			<div className="grid place-items-center rounded-lg border-2 border-brand/30 border-dashed bg-brand-soft/40 p-24">
				<p className="font-bold text-brand-deep text-sm">
					部屋の取得に失敗しました
				</p>
			</div>
		);
	}

	if (!rooms || rooms.length === 0) {
		return <EmptyTable onCreateRoom={onCreateRoom} />;
	}

	return (
		<div className="grid gap-y-12">
			{rooms.map((room, index) => (
				<div
					className="animate-rise motion-reduce:animate-none"
					key={room.gameId}
					style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
				>
					<RoomCard room={room} status="waiting" />
				</div>
			))}
		</div>
	);
}

/**
 * 部屋が無いときの表示
 *
 * NOTE: 破線のグレーの箱に文章を置くだけだと管理画面の空状態に見えるため、
 * 誰も座っていない卓を描いて「最初の1人になる」導線を置く
 */
function EmptyTable({ onCreateRoom }: { onCreateRoom: () => void }) {
	return (
		<div className="grid place-items-center gap-y-16 rounded-2xl border-2 border-ivory-deep border-dashed bg-ivory/50 px-16 py-24">
			<ul aria-hidden="true" className="flex gap-x-8">
				{[1, 2, 3, 4].map((seat) => (
					<li
						className="grid size-32 place-items-center rounded-md border border-ivory-deep border-dashed font-bold text-neutral-300 text-xs"
						key={seat}
					>
						{seat}
					</li>
				))}
			</ul>
			<div className="grid gap-y-6 text-center">
				<p className="font-bold text-moss text-sm">
					いま立っている卓はありません
				</p>
				<p className="text-neutral-500 text-xs">
					最初の1人になって、みんなを待ちましょう
				</p>
			</div>
			<Button
				as="button"
				color="brand"
				leftIcon={<IoGameController />}
				onClick={onCreateRoom}
			>
				部屋をつくる
			</Button>
		</div>
	);
}
