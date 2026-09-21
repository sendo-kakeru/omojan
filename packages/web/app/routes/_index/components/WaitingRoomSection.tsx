import type { WaitingRoom } from "@repo/db/model";
import { Button } from "~/components/button/Button";
import {
	SectionHeading,
	SectionRefreshButton,
} from "~/components/SectionHeading";
import { STAGGER_STEP_MS } from "~/libs/animation";
import { WaitingRoomCard } from "./room-card/WaitingRoomCard";
import { WaitingRoomCardSkeleton } from "./room-card/WaitingRoomCardSkeleton";

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
				action={<SectionRefreshButton onClick={onRefresh} />}
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
		return <WaitingRoomCardSkeleton srText="募集中の部屋を取得中" />;
	}

	if (error) {
		return (
			<div className="grid place-items-center rounded-lg border-2 border-orange-600/30 border-dashed bg-orange-100/40 p-24">
				<p className="font-bold text-orange-700 text-sm">
					部屋の取得に失敗しました
				</p>
			</div>
		);
	}

	if (!rooms || rooms.length === 0) {
		return <EmptyTable onCreateRoom={onCreateRoom} />;
	}

	return <WaitingRoomListItems rooms={rooms} />;
}

/**
 * 一覧に増えた部屋だけ登場演出(rise)が走る
 */
function WaitingRoomListItems({ rooms }: { rooms: WaitingRoom[] }) {
	return (
		<div className="grid gap-y-12">
			{rooms.map((room, index) => (
				<div
					className="animate-rise motion-reduce:animate-none"
					key={room.gameId}
					style={{ animationDelay: `${index * STAGGER_STEP_MS}ms` }}
				>
					<WaitingRoomCard room={room} />
				</div>
			))}
		</div>
	);
}

/**
 * 部屋が無いときの表示
 */
function EmptyTable({ onCreateRoom }: { onCreateRoom: () => void }) {
	return (
		<div className="grid place-items-center gap-y-16 rounded-2xl border-2 border-cream-300 border-dashed bg-cream-50/50 px-16 py-24">
			<div className="grid gap-y-6 text-center">
				<p className="font-bold text-lime-800 text-sm">
					募集中の部屋はありません
				</p>
				<p className="text-neutral-500 text-xs">部屋を作成してみましょう！</p>
			</div>
			<Button as="button" color="primary" onClick={onCreateRoom}>
				部屋をつくる
			</Button>
		</div>
	);
}
