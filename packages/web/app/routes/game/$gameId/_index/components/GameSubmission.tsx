import type {
	GameClientSubmissionMessage,
	GameServerSubmissionMessage,
} from "@repo/db/model";
import type { PlayerCard, PlayerCardId, PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { Tile } from "~/components/Tile";
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
	// 自分の番になった瞬間だけ、画面中央に一瞬バナーを表示する
	const [showMyTurnBanner, setShowMyTurnBanner] = useState(false);

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

	useEffect(() => {
		if (data.type !== "TURN_START" || !isMyTurn) return;
		setShowMyTurnBanner(true);
		const timer = setTimeout(() => setShowMyTurnBanner(false), 1600);
		return () => clearTimeout(timer);
	}, [data.type, isMyTurn]);

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

	// ナビバーに表示する自分の番かどうかのメッセージ
	const getStatusText = (): string | undefined => {
		if (isStarting) return undefined;
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
			{isStarting && (
				<div className="fixed inset-0 z-80 flex items-center justify-center bg-olive-900/55">
					<Tile
						className="grid w-full max-w-xs animate-place-tile place-items-center gap-y-24 px-24 py-32 motion-reduce:animate-none"
						thickness="amber"
					>
						<div className="grid place-items-center gap-y-4">
							<p className="font-display text-[10px] text-lime-800/70 tracking-widest">
								ROUND
							</p>
							<p className="font-display text-5xl text-lime-800">
								{game.roundNo}
								<span className="text-2xl text-neutral-400"> / 4</span>
							</p>
						</div>
						<div className="grid w-full place-items-center gap-y-8">
							<p className="font-bold text-neutral-500 text-xs">お題</p>
							<p className="wrap-break-word w-full rounded-lg border-2 border-amber-300 bg-amber-300/15 px-16 py-12 text-center font-bold text-lime-800 text-xl xs:text-2xl">
								{game.theme}
							</p>
						</div>
						<div className="flex items-center gap-x-8 text-lime-800">
							<Spinner className="size-20" />
							<p className="font-bold text-sm">まもなく開始...</p>
						</div>
					</Tile>
				</div>
			)}
			<GamePhaseLayout
				nav={
					<GamePhaseNav
						roundNo={game.roundNo}
						statusText={getStatusText()}
						timerCount={count}
						timerProgress={progress}
					/>
				}
			>
				{/* 自分の番でオーバーレイ（操作対象以外を暗く） */}
				{isActivePhase && (
					<div className="pointer-events-none fixed inset-0 z-20 bg-olive-900/55" />
				)}

				{/* 自分の番になった瞬間だけ、画面中央に一瞬表示する合図 */}
				{showMyTurnBanner && (
					<div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
						<p className="animate-turn-banner px-16 text-center font-display text-4xl text-cream-50 drop-shadow-[0_4px_24px_var(--color-orange-600)] motion-reduce:animate-none">
							あなたの番です
						</p>
					</div>
				)}

				{/* 他プレイヤーの提出待機中メッセージ */}
				{!isMyTurn && !isStarting && (
					<div className="pointer-events-none fixed bottom-120 left-1/2 z-20 -translate-x-1/2">
						<div className="flex items-center gap-x-8 rounded-full bg-lime-800/90 px-24 py-12 shadow-2xl">
							<Spinner className="size-24 text-white" />
							<p className="whitespace-nowrap font-bold text-sm text-white">
								他のプレイヤーが選択中...
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
											<p className="font-semibold text-xs">
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
							"relative mt-8 grid place-items-center rounded-t-2xl border border-cream-200 border-b-0 bg-cream-50/90 p-16",
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
							onCardClick={isMyTurn ? handleCardClick : undefined}
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
