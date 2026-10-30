import type {
	GameClientSubmissionMessage,
	GameServerSubmissionMessage,
} from "@repo/db/models";
import type { PlayerCard, PlayerCardId, PlayerId } from "@repo/db/schemas";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { useCountdown } from "~/hooks/useCountdown";
import { getDisplayName } from "~/libs/displayName";
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
	reactionBar,
	sendSubmission,
}: {
	data: GameServerSubmissionMessage;
	reactionBar?: ReactNode;
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

	// 自分の番の合図を描画するか
	// NOTE: 表示も非表示もアニメーションが持つので状態は持たない。
	const showMyTurnBanner = isMyTurn && !isStarting;

	// 操作フェーズの判定
	const isActivePhase = isMyTurn && !isConfirmed && !isStarting;

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

	// ナビバーに表示する自分の番かどうかのメッセージ
	const getStatusText = (): string | undefined => {
		// 開始の合図は視覚的にはバナーで伝わるが、お題は読み上げにも必要
		if (isStarting)
			return `ラウンド${game.roundNo}が始まります。お題は「${game.theme}」`;
		if (isMyTurn) {
			return isConfirmed
				? "提出完了！他のプレイヤーを待っています"
				: "あなたの番です";
		}
		return "他のプレイヤーの番です";
	};

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
			{/* ラウンド開始の合図 */}
			{isStarting && (
				<>
					<div className="pointer-events-none fixed inset-0 z-20 animate-round-scrim bg-olive-900/50 motion-reduce:animate-none" />
					<div
						aria-hidden="true"
						className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
					>
						<div className="grid animate-round-banner place-items-center gap-y-4 text-cream-50 drop-shadow-[0_4px_24px_var(--color-orange-600)] motion-reduce:animate-none">
							<p className="font-display text-xs tracking-[0.3em]">ROUND</p>
							<p className="font-display text-6xl">
								{game.roundNo}
								<span className="text-2xl text-cream-50/70"> / 4</span>
							</p>
						</div>
					</div>
				</>
			)}
			<GamePhaseLayout
				nav={
					<GamePhaseNav
						roundNo={game.roundNo}
						statusText={getStatusText()}
						// NOTE: ラウンド開始モーダル表示中は満タンの状態を見せる
						timerCount={isStarting ? game.timeLimit : count}
						timerProgress={isStarting ? 100 : progress}
					/>
				}
			>
				{/* 自分の番でオーバーレイ（操作対象以外を暗く） */}
				{isActivePhase && (
					<div className="pointer-events-none fixed inset-0 z-20 bg-olive-900/55" />
				)}

				{/* 自分の番になった瞬間だけ、画面中央に一瞬表示する合図 */}
				{showMyTurnBanner && (
					<div
						aria-hidden="true"
						className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
					>
						<p
							className={classNames(
								"px-16 text-center font-display text-4xl text-cream-50",
								"animate-turn-banner drop-shadow-[0_4px_24px_var(--color-orange-600)] motion-reduce:animate-turn-banner-fade",
							)}
						>
							あなたの番です
						</p>
					</div>
				)}

				{/* 自分が操作できない間、進行中であることを示すメッセージ */}
				{(isStarting || !isMyTurn) && (
					<div className="pointer-events-none fixed bottom-120 left-1/2 z-20 -translate-x-1/2">
						<div className="flex items-center gap-x-8 rounded-full bg-lime-800/90 px-24 py-12 shadow-2xl">
							<Spinner className="size-24 text-white" />
							<p className="text-sm font-bold whitespace-nowrap text-white">
								{isStarting ? "まもなく開始..." : "他のプレイヤーが選択中..."}
							</p>
						</div>
					</div>
				)}

				<main className="relative grid grid-rows-[auto_1fr_auto]">
					<section className="relative grid rounded-lg border border-cream-200 bg-cream-50/85">
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
												"border-2 border-lime-800 bg-lime-800/10 shadow-[inset_4px_0_0_var(--color-amber-300)]",
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
											<p className="text-xs font-semibold">
												{getDisplayName(player.playerName)}
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
										<Badge color="cream">{player.winCount}勝</Badge>
									</div>
									{index !== game.players.length - 1 && <Separator />}
								</div>
							);
						})}
					</section>

					{/* 中央エリア - お題カード + 組み合わせ選択 */}
					<section
						className={classNames(
							// NOTE: overflow-x-clip は牌を叩きつける演出の拡大が横スクロール領域を
							// 広げないようにするため（縦はみ出しは演出なので clip しない）
							"relative mt-8 grid place-items-center overflow-x-clip rounded-t-2xl border border-b-0 border-cream-200 bg-cream-50/90 p-16",
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
							className="mx-[calc(50%-50vw)] w-screen"
							isConfirmed={isConfirmed}
							onCardClick={
								isMyTurn && !isStarting ? handleCardClick : undefined
							}
							reactionBar={reactionBar}
							selectedCardId={selectedCardId}
							showPulse={isActivePhase && !selectedCard}
						/>
					</div>
				</main>
			</GamePhaseLayout>
		</>
	);
}
