import type {
	GameClientSubmissionMessage,
	GameServerSubmissionMessage,
} from "@repo/db/model";
import type { PlayerCard, PlayerCardId, PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { useCountdown } from "~/hooks/useCountdown";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";
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
	// 送信中フラグ（重複送信防止）
	// Note: useIsLoadingは1秒の遅延があるため、即時リセットが必要な重複送信防止には不適切
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		// 自分のターンで選択中（タップで提出）
		if (isMyTurn && selectedCard && pendingPosition === position) {
			return {
				label,
				onSubmit: async () => {
					if (!selectedCard || !pendingPosition || isSubmitting) return;
					setIsSubmitting(true);
					setConfirmedSubmission({
						position: pendingPosition,
						text: selectedCard.word,
					});
					setPendingPosition(null);
					try {
						// サーバーに提出を送信
						await sendSubmission({
							position: pendingPosition,
							text: selectedCard.word,
						});
					} finally {
						setIsSubmitting(false);
					}
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

	const handleCardClick = (cardId: PlayerCardId) => {
		if (isConfirmed) return;
		const card = mePlayer.playerCards.find((c) => c.id === cardId);
		if (card?.used) return;
		setSelectedCardId(cardId);
		setPendingPosition(null);
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
			<GamePhaseLayout
				nav={
					<GamePhaseNav
						messageVariant={isMyTurn ? "active" : "inactive"}
						roundNo={game.roundNo}
						timerCount={count}
						timerProgress={progress}
					/>
				}
			>
				{/* 自分の番でオーバーレイ（手札・配置エリア以外を暗く） */}
				{isMyTurn && !isConfirmed && (
					<div className="pointer-events-none fixed inset-0 z-20 bg-black/50" />
				)}

				{/* 他プレイヤーの提出待機中メッセージ */}
				{!isMyTurn && !isStarting && (
					<div className="pointer-events-none fixed bottom-120 left-1/2 z-20 -translate-x-1/2">
						<div className="flex items-center gap-x-8 rounded-full bg-neutral-900/60 px-24 py-12 shadow-2xl">
							<Spinner className="size-24 text-white" />
							<p className="whitespace-nowrap text-white">
								他のプレイヤーが選択中...
							</p>
						</div>
					</div>
				)}

				<main className="relative grid grid-rows-[auto_1fr_auto]">
					<section className="relative grid rounded-lg border border-gray-200 bg-white">
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
											src={buildImageUrl({
												image: player.image,
												size: AVATAR_IMAGE_DIMENSIONS.S,
											})}
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

					{/* 配置エリア - 牌選択後にz-indexを上げてオーバーレイの上に表示 */}
					<section
						className={classNames(
							"relative mt-8 grid place-items-center rounded-t-2xl border border-gray-300 border-b-0 bg-white p-16",
							isMyTurn && !isConfirmed && selectedCard && "z-30",
						)}
					>
						{/* 配置選択時のガイダンスメッセージ */}
						{isMyTurn && !isConfirmed && selectedCard && !pendingPosition && (
							<div className="absolute -top-24 left-1/2 z-10 -translate-x-1/2 animate-bounce">
								<p className="whitespace-nowrap rounded-full bg-green-500 px-16 py-4 font-bold text-sm text-white shadow-lg">
									↓ 配置場所をタップ ↓
								</p>
							</div>
						)}
						<div className="grid w-full max-w-480 place-items-center gap-y-16 sm:gap-y-24">
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("prefix")}
							/>
							{/* テーマカード - 自分の番では常にオーバーレイの上に表示 */}
							<p
								className={classNames(
									"grid min-h-56 xs:min-h-64 w-full place-items-center rounded-md border border-yellow-300 bg-yellow-50 p-8 px-12 font-bold text-sm shadow sm:text-base",
									isMyTurn && !isConfirmed && "relative z-30",
								)}
							>
								{game.theme}
							</p>
							<SelectSubmissionCard
								{...buildSelectSubmissionCardProps("suffix")}
							/>
						</div>
					</section>

					{/* 手札エリア - 自分の番ではz-indexを上げてオーバーレイの上に表示 */}
					<div
						className={classNames(isMyTurn && !isConfirmed && "relative z-30")}
					>
						{/* 牌選択時のガイダンスメッセージ */}
						{isMyTurn && !isConfirmed && !selectedCard && (
							<div className="absolute -top-32 left-1/2 z-10 -translate-x-1/2 animate-bounce">
								<p className="whitespace-nowrap rounded-full bg-green-500 px-16 py-4 font-bold text-sm text-white shadow-lg">
									↓ 手札を選んでください ↓
								</p>
							</div>
						)}
						<PlayerCardDisplay
							cards={mePlayer.playerCards}
							isConfirmed={isConfirmed}
							onCardClick={isMyTurn ? handleCardClick : undefined}
							selectedCardId={selectedCardId}
						/>
					</div>
				</main>
			</GamePhaseLayout>
		</>
	);
}
