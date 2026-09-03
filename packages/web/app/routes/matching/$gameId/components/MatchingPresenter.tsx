import type { MatchingParticipant, Room } from "@repo/db/model";
import { PROD_SITE_URL, SITE_NAME } from "@repo/shared/constants/config";
import { FaRegCopy } from "react-icons/fa";
import { FaCheck, FaRegClock } from "react-icons/fa6";
import { IoIosLock, IoMdShare } from "react-icons/io";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { tileClassName } from "~/components/Tile";
import { UserLabel } from "~/components/user/UserLabel";
import { useClipboard } from "~/hooks/useClipboard";
import { useShare } from "~/hooks/useShare";

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
	const { share } = useShare({
		text: `「${roomMeta.title}」で一緒に遊ぼう！`,
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});
	return (
		<main
			className={tileClassName({
				className: "relative my-24 grid gap-y-16 p-16",
				stand: "gold",
			})}
		>
			{transitionCount !== null && (
				<div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-shade/60 backdrop-blur-sm">
					<div className="grid gap-y-16 text-center text-white">
						<Spinner className="mx-auto size-32" />
						<p className="font-bold">
							参加者が集まりました。
							<br />
							<span className="font-display text-2xl text-gold">
								{transitionCount}
							</span>
							秒後にゲーム画面へ移動します。
						</p>
					</div>
				</div>
			)}
			{/* メタセクション */}
			<section className="grid gap-y-16 py-16">
				<div className="grid gap-y-8">
					<div className="flex justify-between">
						<h1 className="font-bold text-moss text-xl">{roomMeta.title}</h1>
						{roomMeta.isPrivate && (
							<div className="rounded-full border border-gold bg-gold/20 p-4">
								<IoIosLock
									aria-label="プライベート部屋"
									className="size-24 text-gold-deep"
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
				{roomMeta.isPrivate && (
					<div className="mx-auto grid w-full max-w-400 gap-y-12 rounded-lg border-2 border-gold border-dashed bg-gold/10 p-8 md:p-16">
						<div className="flex items-center justify-between gap-x-8 px-8">
							<div className="flex items-center gap-x-16">
								<p className="break-keep font-semibold text-sm md:text-base">
									パスワード
								</p>
								<p
									className={tileClassName({
										className:
											"w-fit p-8 px-24 font-display text-lg text-moss tracking-widest",
										stand: "gold",
									})}
								>
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
								{isCopied ? <FaCheck className="text-moss" /> : <FaRegCopy />}
							</Button>
						</div>
						<p className="w-fit text-neutral-500 text-sm">
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
							color="brand"
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
				<div className="flex items-center justify-between gap-x-8">
					<h2 className="font-bold text-moss">参加者</h2>
					<button
						aria-label="友達に共有する"
						className="flex items-center gap-x-6 rounded-full bg-brand-deep px-16 py-6 font-bold text-sm text-white transition-colors hover:bg-brand-darker"
						onClick={share}
						type="button"
					>
						<IoMdShare className="size-18" />
						友達を誘う
					</button>
				</div>
				<p className="text-neutral-500 text-sm">
					4人揃ったらゲームが開始されます。
					{isHost && "「今すぐ開始」で募集中のプレイヤーをCPUで開始します。"}
				</p>
				<ul className="grid gap-y-8">
					{[1, 2, 3, 4].map((seat) => (
						<li key={seat}>
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

/** 席。着席済みは牌、空席は点線の枠で「あと何人か」を一目で分かるようにする */
function MatchingParticipantLabel({
	participant,
	seat,
}: {
	participant?: MatchingParticipant;
	seat: number;
}) {
	const seatNumber = (
		<span className="grid size-24 shrink-0 place-items-center rounded-full bg-mat font-display text-[10px] text-neutral-500">
			{seat}
		</span>
	);

	if (participant) {
		return (
			<div
				className={tileClassName({
					className: "flex animate-rise items-center gap-x-12 px-12 py-8",
				})}
			>
				{seatNumber}
				<UserLabel
					textProps={{ className: "font-bold text-moss" }}
					user={{
						image: participant.image ?? undefined,
						name: participant.playerName,
					}}
				/>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-x-12 rounded-lg border-2 border-ivory-deep border-dashed px-12 py-8">
			{seatNumber}
			<div className="size-32 shrink-0 rounded-full border border-ivory-deep border-dashed" />
			<p className="overflow-hidden text-ellipsis whitespace-nowrap text-neutral-400 text-sm">
				募集中...
			</p>
		</div>
	);
}
