import type { MatchingParticipant, Room } from "@repo/db/model";
import { FaRegCopy } from "react-icons/fa";
import { FaCheck, FaRegClock } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { UserLabel } from "~/components/user/UserLabel";
import { useClipboard } from "~/hooks/useClipboard";

export function MatchingPresenter({
	roomMeta,
	participants,
	isHost,
	transitionCount,
	isStarting,
	onExit,
	onStart,
}: {
	roomMeta: Pick<Room, "title" | "isPrivate" | "password" | "timeLimit">;
	participants: MatchingParticipant[];
	isHost: boolean;
	transitionCount: number | null;
	isStarting: boolean;
	onExit: () => void;
	onStart: () => void;
}) {
	const { isCopied, copy } = useClipboard(roomMeta.password ?? "");
	return (
		<main className="relative my-24 grid gap-y-16 rounded-lg border border-gray-200 bg-white p-16">
			{transitionCount !== null && (
				<div className="absolute inset-0 z-10 grid place-items-center bg-gray-200/70 backdrop-blur-sm">
					<div className="grid gap-y-6 text-center text-gray-700">
						<Spinner className="mx-auto size-32" />
						<p className="font-semibold">
							参加者が集まりました。{transitionCount}
							秒後にゲーム画面へ移動します。
						</p>
					</div>
				</div>
			)}
			{/* メタセクション */}
			<section className="grid gap-y-16 py-16">
				<div className="grid gap-y-8">
					<div className="flex justify-between">
						<h1 className="font-bold text-xl">{roomMeta.title}</h1>
						{roomMeta.isPrivate && (
							<div className="rounded-full border border-gray-300 bg-gray-100 p-4">
								<IoIosLock
									aria-label="プライベート部屋"
									className="size-24 text-green-400"
									role="img"
								/>
							</div>
						)}
					</div>
					<div className="flex items-center gap-x-8 text-gray-500">
						<FaRegClock className="size-20" />
						<p className="text-md">制限時間: {roomMeta.timeLimit}秒</p>
					</div>
				</div>
				{roomMeta.isPrivate && (
					<div className="mx-auto grid w-full max-w-400 gap-y-12 rounded-lg border border-green-300 bg-green-50 p-8 md:p-16">
						<div className="flex items-center justify-between gap-x-8 px-8">
							<div className="flex items-center gap-x-16">
								<p className="break-keep font-semibold text-sm md:text-md">
									パスワード
								</p>
								<p className="w-fit rounded-lg border border-green-300 bg-white p-8 px-24 font-mono text-xl">
									{roomMeta.password}
								</p>
							</div>
							<Button
								as="button"
								color="gray"
								isIconOnly
								onClick={copy}
								variant="outline"
							>
								{isCopied ? (
									<FaCheck className="text-green-400" />
								) : (
									<FaRegCopy />
								)}
							</Button>
						</div>
						<p className="w-fit text-gray-500 text-sm">
							参加者にパスワードを共有してください。
						</p>
					</div>
				)}
				<div className="mx-auto flex w-full flex-col items-center justify-center gap-8 sm:flex-row sm:gap-x-12">
					<Button
						as="button"
						className="w-full max-w-280"
						color="danger"
						onClick={onExit}
						variant="outline"
					>
						退出する
					</Button>
					{isHost && (
						<Button
							as="button"
							className="w-full max-w-280"
							disabled={
								isStarting ||
								participants.length >= 4 ||
								transitionCount !== null
							}
							leftIcon={
								isStarting ? <Spinner className="size-16" /> : undefined
							}
							onClick={onStart}
						>
							今すぐ開始
						</Button>
					)}
				</div>
			</section>

			<Separator />

			<section className="grid gap-y-16">
				<div className="grid items-center gap-y-4 md:grid-cols-[auto_1fr] md:gap-x-16">
					<h2 className="font-bold">参加者</h2>
					<p className="text-gray-500 text-sm">
						4人揃ったらゲームが開始されます。
						{isHost && "「今すぐ開始」で募集中のプレイヤーをCPUで開始します。"}
					</p>
				</div>
				<ul className="grid gap-y-12">
					{[1, 2, 3, 4].map((seat) => (
						<li key={seat}>
							<MatchingParticipantLabel participant={participants[seat - 1]} />
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

function MatchingParticipantLabel({
	participant,
}: {
	participant?: MatchingParticipant;
}) {
	if (participant) {
		return (
			<UserLabel
				user={{
					image: participant.image ?? undefined,
					name: participant.playerName,
				}}
			/>
		);
	}

	return (
		<div className="flex items-center gap-x-8">
			<div className="size-32 rounded-full border border-gray-300 border-dashed" />
			<p className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-400 text-sm">
				募集中
			</p>
		</div>
	);
}
