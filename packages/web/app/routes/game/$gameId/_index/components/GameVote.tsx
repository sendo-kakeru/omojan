import type {
	GameClientVoteMessage,
	GameServerVoteMessage,
} from "@repo/db/model";
import type { PlayerId } from "@repo/db/schema";
import classNames from "classnames";
import { useEffect, useState } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { useCountdown } from "~/hooks/useCountdown";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

export function GameVote({
	data,
	sendVote,
}: {
	data: GameServerVoteMessage;
	sendVote: (
		votePlayerId: GameClientVoteMessage["votePlayerId"],
	) => Promise<void>;
}) {
	const { game, mePlayer } = data;

	const [selectedPlayerId, setSelectedPlayerId] = useState<PlayerId | null>(
		null,
	);
	const [confirmedPlayerId, setConfirmedPlayerId] = useState<PlayerId | null>(
		null,
	);
	// 送信中フラグ（重複送信防止）
	// Note: useIsLoadingは1秒の遅延があるため、即時リセットが必要な重複送信防止には不適切
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { count, progress, start: startCountdown } = useCountdown();

	useEffect(() => {
		startCountdown(15);
	}, [startCountdown]);

	const getMessage = () => {
		if (confirmedPlayerId) {
			return "投票完了！他のプレイヤーを待っています";
		}
		return null;
	};

	const handlePlayerClick = async (playerId: PlayerId) => {
		if (playerId === mePlayer.id) return;
		if (confirmedPlayerId || isSubmitting) return;

		// 既に選択中の場合は投票を確定
		if (selectedPlayerId === playerId) {
			setIsSubmitting(true);
			setConfirmedPlayerId(playerId);
			try {
				await sendVote(playerId);
			} finally {
				setIsSubmitting(false);
			}
			return;
		}

		// 未選択または別のプレイヤーを選択
		setSelectedPlayerId(playerId);
	};

	return (
		<GamePhaseLayout
			nav={
				<GamePhaseNav
					message={getMessage()}
					messageVariant={confirmedPlayerId ? "inactive" : "active"}
					roundNo={game.roundNo}
					timerCount={count}
					timerProgress={progress}
				/>
			}
		>
			{/* プレイヤーカード以外を暗くするオーバーレイ */}
			{!confirmedPlayerId && (
				<div className="pointer-events-none fixed inset-0 z-20 bg-black/50" />
			)}

			<main className="grid grid-rows-[1fr_auto]">
				{/* プレイヤー選択エリア - z-indexを上げてオーバーレイの上に表示 */}
				<section
					className={classNames(
						"relative my-auto grid h-fit content-center rounded-lg",
						!confirmedPlayerId && "z-30",
					)}
				>
					{/* 投票時のガイダンスメッセージ */}
					{!confirmedPlayerId && !selectedPlayerId && (
						<div className="absolute -top-40 left-1/2 z-10 -translate-x-1/2 animate-bounce">
							<p className="whitespace-nowrap rounded-full bg-green-500 px-16 py-4 font-bold text-sm text-white shadow-lg">
								↓ 面白い組み合わせをタップ ↓
							</p>
						</div>
					)}
					{game.players.map((player) => {
						const isSelf = player.id === mePlayer.id;
						const isSelected = selectedPlayerId === player.id;
						const isConfirmed = confirmedPlayerId === player.id;
						const combination = createCombination({
							position: player.submission?.position,
							text: player.submission?.text,
							theme: game.theme,
						});

						return (
							<div className="relative w-full" key={player.id}>
								<button
									className={classNames(
										"flex w-full items-center gap-x-12 rounded-lg px-12 py-8 transition-colors md:py-12",
										isSelf
											? "cursor-not-allowed border-2 border-transparent bg-gray-200 opacity-90"
											: isConfirmed
												? "border-2 border-green-500 bg-green-100"
												: isSelected
													? "border-2 border-green-500 bg-green-50"
													: "border border-gray-200 bg-white hover:bg-green-50",
									)}
									disabled={isSelf || !!confirmedPlayerId}
									onClick={() => handlePlayerClick(player.id)}
									type="button"
								>
									<div className="grid flex-1 gap-y-2">
										<div className="flex items-center gap-x-8">
											<Avatar
												name={player.playerName}
												size="S"
												src={player.image ?? undefined}
											/>
											<p className="font-semibold text-neutral-400 text-xs">
												{player.playerName}
												{isSelf && (
													<span className="text-neutral-400">（自分）</span>
												)}
											</p>
										</div>
										<p
											className={classNames(
												"font-bold text-base md:text-lg",
												isSelf && "text-neutral-400",
											)}
										>
											{combination}
										</p>
										{/* 選択中のみ「タップで投票」を表示 */}
										{isSelected && !confirmedPlayerId && (
											<span className="text-green-600 text-xs mt-4">
												タップで投票
											</span>
										)}
									</div>
									{/* 固定幅でバッジの位置を安定させる */}
									<div className="grid w-64 place-items-center">
										{isConfirmed ? (
											<span className="whitespace-nowrap rounded-full bg-green-600 px-8 py-2 text-white text-xs">
												投票済み
											</span>
										) : (
											<Badge color="gray">{player.winCount}勝</Badge>
										)}
									</div>
								</button>
							</div>
						);
					})}
				</section>

				<PlayerCardDisplay cards={mePlayer.playerCards} />
			</main>
		</GamePhaseLayout>
	);
}
