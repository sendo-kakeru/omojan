import type {
	GameClientSubmissionMessage,
	GameServerSubmissionMessage,
} from "@repo/db/model";
import type { PlayerCard, PlayerCardId, PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { tileClassName } from "~/components/Tile";
import { useCountdown } from "~/hooks/useCountdown";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { createCombination, vibrate } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";
import { SubmissionCard } from "./SubmissionCard";
import { ThemeCard } from "./ThemeCard";

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
	const [isPending, startTransition] = useTransition();

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

	// 操作フェーズの判定
	const isActivePhase = isMyTurn && !isConfirmed;

	// 確定済みの提出情報（自分 or 他プレイヤー）
	const resolvedSubmission = (() => {
		if (isConfirmed && isMyTurn) {
			const text = createCombination({
				position: confirmedSubmission.position,
				text: confirmedSubmission.text,
				theme: game.theme,
			});
			if (!text) return;
			return { position: confirmedSubmission.position, text };
		}
		if (!isMyTurn && game.submitted) {
			const text = createCombination({
				position: game.submitted.position,
				text: game.submitted.text,
				theme: game.theme,
			});
			if (!text) return;
			return { position: game.submitted.position, text };
		}
	})();

	const handleCardClick = (cardId: PlayerCardId): void => {
		if (isConfirmed) return;
		const card = mePlayer.playerCards.find((c) => c.id === cardId);
		if (card?.used) return;
		setSelectedCardId(cardId);
		setPendingPosition(null);
	};

	const handleComboSelect = (position: Position): void => {
		if (!selectedCard || isConfirmed || isPending) return;
		// 同じ選択肢を2度タップで確定
		if (pendingPosition === position) {
			setConfirmedSubmission({
				position,
				text: selectedCard.word,
			});
			setPendingPosition(null);
			vibrate();
			startTransition(async () => {
				try {
					await sendSubmission({
						position,
						text: selectedCard.word,
					});
				} catch (error) {
					console.error("提出の送信に失敗しました:", error);
					setConfirmedSubmission(null);
				}
			});
			return;
		}
		setPendingPosition(position);
	};

	return (
		<>
			{isStarting && (
				<div className="fixed inset-0 z-80 flex items-center justify-center bg-shade/55">
					<div
						className={tileClassName({
							className:
								"grid w-full max-w-xs animate-place-tile place-items-center gap-y-24 px-24 py-32 motion-reduce:animate-none",
							stand: "gold",
						})}
					>
						<div className="grid place-items-center gap-y-4">
							<p className="font-display text-[10px] text-moss/70 tracking-widest">
								ROUND
							</p>
							<p className="font-display text-5xl text-moss">
								{game.roundNo}
								<span className="text-2xl text-neutral-400"> / 4</span>
							</p>
						</div>
						<div className="grid w-full place-items-center gap-y-8">
							<p className="font-bold text-neutral-500 text-xs">お題</p>
							<p className="w-full rounded-lg border-2 border-gold bg-gold/15 px-16 py-12 text-center font-bold text-lg text-moss">
								{game.theme}
							</p>
						</div>
						<div className="flex items-center gap-x-8 text-moss">
							<Spinner className="size-20" />
							<p className="font-bold text-sm">まもなく開始...</p>
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
				{/* 自分の番でオーバーレイ（操作対象以外を暗く） */}
				{isActivePhase && (
					<div className="pointer-events-none fixed inset-0 z-20 bg-shade/55" />
				)}

				{/* 他プレイヤーの提出待機中メッセージ */}
				{!isMyTurn && !isStarting && (
					<div className="pointer-events-none fixed bottom-120 left-1/2 z-20 -translate-x-1/2">
						<div className="flex items-center gap-x-8 rounded-full bg-moss/90 px-24 py-12 shadow-2xl">
							<Spinner className="size-24 text-white" />
							<p className="whitespace-nowrap font-bold text-sm text-white">
								他のプレイヤーが選択中...
							</p>
						</div>
					</div>
				)}

				<main className="relative grid grid-rows-[auto_1fr_auto]">
					<section className="relative grid rounded-lg border border-ivory-edge bg-ivory/85">
						{game.players.map((player, index) => {
							const isSelf = player.id === mePlayer.id;
							const isCurrentPlayer = player.id === currentPlayerId;
							const combination = getPlayerCombination(player.id);

							return (
								<div className="w-full" key={player.id}>
									<div
										className={classNames(
											"flex items-center gap-x-8 rounded-lg px-8 py-4 transition-colors md:px-12",
											isCurrentPlayer &&
												"border-2 border-moss bg-moss/10 shadow-[inset_4px_0_0_var(--color-gold)]",
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
													<span className="font-normal text-neutral-400">
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

					{/* 中央エリア - お題カード + 組み合わせ選択 */}
					<section
						className={classNames(
							"relative mt-8 grid place-items-center rounded-t-2xl border border-ivory-edge border-b-0 bg-ivory/90 p-16",
							isActivePhase && "z-30",
						)}
					>
						<div className="grid w-full max-w-480 place-items-center gap-y-16 sm:gap-y-24">
							{resolvedSubmission ? (
								<SubmissionCard
									position={resolvedSubmission.position}
									state="confirmed"
									text={resolvedSubmission.text}
								/>
							) : (
								<ThemeCard theme={game.theme} />
							)}

							{isActivePhase && !!selectedCard && (
								<SubmissionCard
									onSelect={handleComboSelect}
									position={pendingPosition}
									state="selecting"
									theme={game.theme}
									word={selectedCard.word}
								/>
							)}
						</div>
					</section>

					{/* 手札エリア - 自分の番では常にz-indexを上げる（カード再選択を可能に） */}
					<div className={classNames(isActivePhase && "relative z-30")}>
						<PlayerCardDisplay
							cards={mePlayer.playerCards}
							isConfirmed={isConfirmed}
							onCardClick={isMyTurn ? handleCardClick : undefined}
							selectedCardId={selectedCardId}
							showPulse={isActivePhase && !selectedCard}
						/>
					</div>
				</main>
			</GamePhaseLayout>
		</>
	);
}
