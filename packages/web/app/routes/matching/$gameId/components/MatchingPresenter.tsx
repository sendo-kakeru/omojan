import type { MatchingParticipant, Room } from "@repo/db/models";
import { PROD_SITE_URL, SITE_NAME } from "@repo/shared/constants/config";
import { FaRegCopy } from "react-icons/fa";
import { FaCheck, FaRegClock } from "react-icons/fa6";
import { IoIosLock, IoMdShare } from "react-icons/io";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { Tile } from "~/components/Tile";
import { UserLabel } from "~/components/user/UserLabel";
import { useClipboard } from "~/hooks/useClipboard";
import { useShare } from "~/hooks/useShare";

export function MatchingPresenter({
	roomMeta,
	participants,
	isHost,
	isStarting,
	onExit,
	onStart,
}: {
	roomMeta: Pick<Room, "title" | "isPrivate" | "password" | "timeLimit">;
	participants: MatchingParticipant[];
	isHost: boolean;
	isStarting: boolean;
	onExit: () => void;
	onStart: () => void;
}) {
	const { isCopied, copy } = useClipboard(roomMeta.password ?? "");
	const { share } = useShare({
		text: `「${roomMeta.title}」で一緒に遊ぼう！`,
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});
	return (
		<main className="relative my-24 grid gap-y-16">
			{/* タイトル・基本情報 */}
			<div className="grid gap-y-8 px-4">
				<div className="flex items-center justify-between gap-x-8">
					<h1 className="text-xl font-bold text-lime-800">{roomMeta.title}</h1>
					{roomMeta.isPrivate && (
						<div className="rounded-full border border-amber-300 bg-amber-300/20 p-4">
							<IoIosLock
								aria-label="プライベート部屋"
								className="size-24 text-amber-500"
								role="img"
							/>
						</div>
					)}
				</div>
				<div className="flex items-center gap-x-8 text-neutral-500">
					<FaRegClock className="size-20" />
					<p>制限時間: {roomMeta.timeLimit}秒</p>
				</div>
			</div>

			{/* 操作カード */}
			<Tile className="grid gap-y-16 p-16" thickness="amber">
				{roomMeta.isPrivate && (
					<div className="mx-auto grid w-full max-w-400 gap-y-12 rounded-lg border-2 border-dashed border-amber-300 bg-amber-300/10 p-8 md:p-16">
						<div className="flex items-center justify-between gap-x-8 px-8">
							<div className="flex items-center gap-x-16">
								<p className="text-sm font-semibold break-keep md:text-base">
									パスワード
								</p>
								<Tile
									className="w-fit p-8 px-24 font-display text-lg tracking-widest text-lime-800"
									thickness="amber"
								>
									{roomMeta.password}
								</Tile>
							</div>
							<Button
								as="button"
								color="cream"
								isIconOnly
								onClick={copy}
								variant="outline"
							>
								{isCopied ? (
									<FaCheck className="text-lime-800" />
								) : (
									<FaRegCopy />
								)}
							</Button>
						</div>
						<p className="w-fit text-sm text-neutral-500">
							参加者にパスワードを共有してください。
						</p>
					</div>
				)}
				<div className="mx-auto grid w-full max-w-280 gap-y-12">
					{isHost && (
						<Button
							as="button"
							color="primary"
							disabled={isStarting || participants.length >= 4}
							leftIcon={
								isStarting ? <Spinner className="size-16" /> : undefined
							}
							onClick={onStart}
						>
							今すぐ開始
						</Button>
					)}
					<Button as="button" color="danger" onClick={onExit} variant="outline">
						退出する
					</Button>
				</div>
			</Tile>

			<Separator />

			<section className="grid gap-y-16">
				<div className="flex items-center justify-between gap-x-8">
					<h2 className="font-bold text-lime-800">参加者</h2>
					<Button
						aria-label="友達に共有する"
						as="button"
						color="primary"
						leftIcon={<IoMdShare className="size-18" />}
						onClick={share}
						size="S"
					>
						友達を誘う
					</Button>
				</div>
				<p className="text-sm text-neutral-500">
					4人揃ったらゲームが開始されます。
					{isHost && "「今すぐ開始」で募集中のプレイヤーをCPUで開始します。"}
				</p>
				<ul className="grid gap-y-8">
					{[1, 2, 3, 4].map((seat) => (
						<li className="min-w-0" key={seat}>
							<MatchingParticipantLabel
								participant={participants[seat - 1]}
								seat={seat}
							/>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

function MatchingParticipantLabel({
	participant,
	seat,
}: {
	participant?: MatchingParticipant;
	seat: number;
}) {
	const seatNumber = (
		<span className="grid size-24 shrink-0 place-items-center rounded-full bg-cream-100 font-display text-[10px] text-neutral-500">
			{seat}
		</span>
	);

	if (participant) {
		return (
			<Tile className="flex animate-rise items-center gap-x-12 px-12 py-8">
				{seatNumber}
				<UserLabel
					textProps={{ className: "font-bold text-lime-800" }}
					user={{
						image: participant.image ?? undefined,
						name: participant.playerName,
					}}
				/>
			</Tile>
		);
	}

	return (
		<div className="flex items-center gap-x-12 rounded-lg border-2 border-dashed border-cream-300 px-12 py-8">
			{seatNumber}
			<div className="size-32 shrink-0 rounded-full border border-dashed border-cream-300" />
			<p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap text-neutral-400">
				募集中...
			</p>
		</div>
	);
}
