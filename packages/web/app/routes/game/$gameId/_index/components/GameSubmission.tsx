import type {
	GameClientSubmissionMessage,
	GameServerSubmissionMessage,
} from "@repo/db/model";
import type { PlayerCard, PlayerCardId, PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { CircularTimerProgress } from "~/components/CircularTimerProgress";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";
import {
	SelectSubmissionCard,
	type SelectSubmissionCardProps,
} from "./SelectSubmissionCard";

type Position = "prefix" | "suffix";

export function GameSubmission({
	data,
	sendSubmission,
}: {
	data: GameServerSubmissionMessage;
	sendSubmission: (
		message: GameClientSubmissionMessage["submission"],
	) => Promise<void>;
}) {
	const { currentPlayerId, game, mePlayer } = data;
	const isMyTurn = currentPlayerId === mePlayer.id;
	const isStarting = data.type === "ROUND_START";
	// 選択中のカードID（確定前後どちらでも保持）
	const [selectedCardId, setSelectedCardId] = useState<PlayerCardId | null>(
		null,
	);
	// 選択中の配置位置（確定前はnull）
	const [pendingPosition, setPendingPosition] = useState<Position | null>(null);
	// 確定した提出内容
	const [confirmedSubmission, setConfirmedSubmission] = useState<{
		position: Position;
		text: PlayerCard["text"];
	} | null>(null);
	const selectedCard = mePlayer.playerCards.find(
		(card) => card.id === selectedCardId,
	);
	const isConfirmed = confirmedSubmission !== null;

	// カウントダウンタイマー
	const { count, progress, start: startCountdown } = useCountdown();

	// TURN_START時に状態をリセットしてカウントダウンを開始
	useEffect(() => {
		if (data.type === "TURN_START") {
			setSelectedCardId(null);
			setPendingPosition(null);
			setConfirmedSubmission(null);
			startCountdown(game.timeLimit);
		}
	}, [data.type, game.timeLimit, startCountdown]);

	// プレイヤーの組み合わせ文字列を取得
	const getPlayerCombination = (playerId: PlayerId): string | null => {
		const isSelf = playerId === mePlayer.id;
		// 自分のターンでカード選択中または確定済みの場合はローカル状態を使用
		if (isSelf && isMyTurn && (selectedCard || isConfirmed)) {
			return createCombination({
				position: confirmedSubmission?.position ?? pendingPosition,
				text: confirmedSubmission?.text ?? selectedCard?.word,
				theme: game.theme,
			});
		}
		// それ以外はサーバーの提出データを使用
		const player = game.players.find((player) => player.id === playerId);
		return createCombination({
			position: player?.submission?.position,
			text: player?.submission?.text,
			theme: game.theme,
		});
	};

	// SelectSubmissionCardのpropsを生成
	const buildSelectSubmissionCardProps = (
		position: Position,
	): SelectSubmissionCardProps => {
		const label = position === "prefix" ? "前" : "後";

		// 自分のターンで確定済み
		if (isMyTurn && confirmedSubmission?.position === position) {
			return {
				label,
				state: "placed",
				word: confirmedSubmission.text,
			};
		}
		// 自分のターンで選択中（決定ボタン表示）
		if (isMyTurn && selectedCard && pendingPosition === position) {
			return {
				label,
				onConfirm: async () => {
					if (!selectedCard || !pendingPosition) return;
					setConfirmedSubmission({
						position: pendingPosition,
						text: selectedCard.word,
					});
					setPendingPosition(null);
					// サーバーに提出を送信
					await sendSubmission({
						position: pendingPosition,
						text: selectedCard.word,
					});
				},
				state: "selected",
				word: selectedCard.word,
			};
		}
		// 他プレイヤーのターンで提出済み（提出結果表示）
		if (!isMyTurn && game.submitted && game.submitted.position === position) {
			return {
				label,
				state: "placed",
				word: game.submitted.text,
			};
		}
		// 自分の番ではない、または確定済み
		if (!isMyTurn || isConfirmed) {
			return { label, state: "idle" };
		}
		// 選択待ち
		return {
			disabled: !selectedCard,
			label,
			onSelect: () => {
				if (!selectedCard || isConfirmed) return;
				setPendingPosition(position);
			},
			state: "ready",
		};
	};

	const getMessage = () => {
		if (isStarting) {
			return "ゲームを開始しています";
		}
		if (isMyTurn) {
			return "あなたの番です。面白いと思う組み合わせを選んでください。";
		}
		return "他のプレイヤーの提出を待っています。";
	};

	return (
		<>
			{isStarting && (
				<div className="fixed inset-0 z-80 flex items-center justify-center bg-black/40">
					<div className="grid w-full max-w-xs place-items-center gap-y-24 rounded-2xl bg-white px-24 py-32 shadow-xl">
						<div className="grid place-items-center gap-y-8">
							<p className="font-mono text-neutral-500 text-sm">Round</p>
							<p className="font-bold text-4xl text-neutral-800">
								{game.roundNo}
								<span className="text-neutral-400"> / 4</span>
							</p>
						</div>
						<div className="grid w-full place-items-center gap-y-8">
							<p className="text-neutral-500 text-sm">お題</p>
							<p className="w-full rounded-lg border border-yellow-300 bg-yellow-50 px-16 py-12 text-center font-bold text-lg text-neutral-800">
								{game.theme}
							</p>
						</div>
						<div className="flex items-center gap-x-8 text-neutral-500">
							<Spinner className="size-20" />
							<p className="text-sm">まもなく開始...</p>
						</div>
					</div>
				</div>
			)}
			<div className="grid h-full grid-rows-[auto_1fr] gap-y-8 pt-8 xs:pt-16">
				<nav className="flex w-full items-center gap-x-8">
					<div className="grid w-fit place-items-center rounded-lg border border-gray-200 bg-white px-8 py-2 font-mono text-neutral-600">
						<span className="text-xs">Round</span>
						<div className="flex items-center">
							<span className="text-base">{game.roundNo}</span>/
							<span className="text-base">4</span>
						</div>
					</div>
					<p
						className={classNames(
							"flex h-full flex-1 items-center rounded-lg border px-8 py-2 text-sm",
							isMyTurn
								? "border-green-300 bg-white text-green-600"
								: "border-gray-300 bg-gray-50 text-neutral-500",
						)}
					>
						{getMessage()}
					</p>
					<CircularTimerProgress count={count} progress={progress} />
				</nav>
				<main className="grid grid-rows-[auto_1fr_auto]">
					<section className="grid rounded-lg border border-gray-200 bg-white">
						{game.players.map((player, index) => {
							const isSelf = player.id === mePlayer.id;
							const isCurrentPlayer = player.id === currentPlayerId;
							const combination = getPlayerCombination(player.id);

							return (
								<div className="w-full" key={player.id}>
									<div
										className={classNames(
											"flex items-center gap-x-8 rounded-lg border-green-400 px-8 py-4 transition-colors md:px-12",
											isCurrentPlayer && "border bg-green-50",
										)}
									>
										<Avatar
											name={player.playerName}
											size="S"
											src={player.image ?? undefined}
										/>
										<div className="grid flex-1 gap-y-1 md:gap-y-2">
											<p className="font-semibold text-xs">
												{player.playerName}
												{isSelf && (
													<span className="font-normal text-neutral-300">
														（自分）
													</span>
												)}
											</p>
											<Badge
												className={classNames(!combination && "opacity-0")}
											>
												{combination ?? "未選択"}
											</Badge>
										</div>
										<Badge color="gray">{player.winCount}勝</Badge>
									</div>
									{index !== game.players.length - 1 && <Separator />}
								</div>
							);
						})}
					</section>

					<section className="mt-8 grid place-items-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16">
						<div className="grid w-full max-w-480 place-items-center gap-y-16 sm:gap-y-24">
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("prefix")}
							/>
							<p className="grid min-h-56 xs:min-h-64 w-full place-items-center rounded-md border border-yellow-300 bg-yellow-50 p-8 px-12 font-bold text-sm shadow sm:text-base">
								{game.theme}
							</p>
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("suffix")}
							/>
						</div>
					</section>

					{/* cqwを使って画面いっぱいに広げると　safariで崩れる。若干ズレはあるが最もマシな形をとっている。 */}
					<section className="relative right-1/2 left-1/2 -mx-[50vw] w-screen border-t-2 border-t-gray-300 bg-white py-8 xs:pt-16 sm:py-24">
						<div className="mx-auto flex max-w-800 flex-wrap gap-8 px-16">
							{mePlayer.playerCards.map((card) => {
								const isSelected = card.id === selectedCardId;
								return (
									<button
										className={classNames(
											"flex rounded-md border px-8 py-4 text-center font-bold text-neutral-800 text-sm xs:text-base transition sm:text-lg",
											card.used
												? "cursor-not-allowed border-gray-300 bg-gray-200 opacity-50"
												: isSelected && isConfirmed
													? "border-green-500 bg-green-100 opacity-50"
													: isSelected
														? "border-green-400 bg-green-50 shadow-sm"
														: "border-gray-200 bg-gray-100 hover:bg-green-50",
										)}
										disabled={card.used || isConfirmed || !isMyTurn}
										key={card.id}
										onClick={() => {
											if (isConfirmed || card.used) return;
											setSelectedCardId(card.id);
											setPendingPosition(null);
										}}
										type="button"
									>
										{card.word}
									</button>
								);
							})}
						</div>
						{!isMyTurn && (
							<div className="absolute inset-0 z-50 bg-gray-600 opacity-50" />
						)}
					</section>
				</main>
			</div>
		</>
	);
}
