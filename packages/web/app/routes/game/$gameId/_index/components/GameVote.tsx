import type {
	GameClientVoteMessage,
	GameServerVoteMessage,
} from "@repo/db/models";
import type { PlayerId } from "@repo/db/schemas";
import { VOTE_TIMEOUT_MS } from "@repo/shared/constants/game";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Tile } from "~/components/Tile";
import { useCountdown } from "~/hooks/useCountdown";
import { getDisplayName } from "~/libs/displayName";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

export function GameVote({
	data,
	reactionBar,
	sendVote,
}: {
	data: GameServerVoteMessage;
	reactionBar?: ReactNode;
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
	const [isPending, startTransition] = useTransition();

	const { count, progress, start: startCountdown } = useCountdown();

	useEffect(() => {
		startCountdown(VOTE_TIMEOUT_MS / 1000);
	}, [startCountdown]);

	const getStatusText = (): string => {
		if (confirmedPlayerId) {
			return "投票完了。他のプレイヤーを待っています";
		}
		return "投票してください";
	};

	const handlePlayerClick = (playerId: PlayerId): void => {
		if (playerId === mePlayer.id) return;
		if (confirmedPlayerId || isPending) return;

		// 既に選択中の場合は投票を確定
		if (selectedPlayerId === playerId) {
			setConfirmedPlayerId(playerId);
			startTransition(async () => {
				try {
					await sendVote(playerId);
				} catch (error) {
					console.error("投票の送信に失敗しました:", error);
					setConfirmedPlayerId(null);
				}
			});
			return;
		}

		// 未選択または別のプレイヤーを選択
		setSelectedPlayerId(playerId);
	};

	return (
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
			{/* プレイヤーカード以外を暗くするオーバーレイ */}
			{!confirmedPlayerId && (
				<div className="pointer-events-none fixed inset-0 z-20 bg-olive-900/55" />
			)}

			<main className="grid grid-rows-[1fr_auto]">
				{/* プレイヤー選択エリア - z-indexを上げてオーバーレイの上に表示 */}
				<section
					className={classNames(
						"relative my-auto grid h-fit content-center gap-y-4 rounded-lg",
						!confirmedPlayerId && "z-30",
					)}
				>
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
								<Tile
									as="button"
									className={classNames(
										"flex w-full items-center gap-x-12 px-12 py-8 md:py-12",
										isSelf && "cursor-not-allowed opacity-60",
										isConfirmed && "border-lime-800 bg-lime-800/10",
										isSelected && !isConfirmed && "z-10",
										!isSelf &&
											!confirmedPlayerId &&
											!isSelected &&
											// NOTE: box-shadowを動かすアニメーションはホバー時のbox-shadowより強く、点滅中はホバーしても厚みが増えず立体に見えないため止める
											"animate-pulse-card hover:animate-none motion-reduce:animate-none",
									)}
									disabled={isSelf || !!confirmedPlayerId}
									interactive={!isSelf && !confirmedPlayerId}
									onClick={() => handlePlayerClick(player.id)}
									raised={isSelected && !isConfirmed}
									thickness={(() => {
										if (isSelf) return "cream";
										if (isConfirmed || isSelected) return "lime";
										return "amber";
									})()}
								>
									<div className="grid min-w-0 flex-1 gap-y-2">
										<div className="flex items-center gap-x-8">
											<Avatar
												name={player.playerName}
												size="S"
												src={buildImageUrl({
													image: player.image,
													size: AVATAR_IMAGE_DIMENSIONS.S,
												})}
											/>
											<p className="text-xs font-bold text-neutral-500">
												{getDisplayName(player.playerName)}
												{isSelf && (
													<span className="font-normal text-neutral-400">
														（自分）
													</span>
												)}
											</p>
										</div>
										<p
											className={classNames(
												"text-sm font-bold wrap-break-word carved-text md:text-base",
												isSelf ? "text-neutral-400" : "text-lime-800",
											)}
										>
											{combination}
										</p>
									</div>
									{/* 固定幅でバッジの位置を安定させる */}
									<div className="grid w-64 place-items-center">
										{isConfirmed ? (
											<span className="rounded-full bg-lime-800 px-8 py-2 text-xs font-bold whitespace-nowrap text-white">
												投票済み
											</span>
										) : (
											<Badge color="cream">{player.winCount}勝</Badge>
										)}
									</div>
								</Tile>
							</div>
						);
					})}
				</section>

				<PlayerCardDisplay
					cards={mePlayer.playerCards}
					className="mx-[calc(50%-50vw)] w-screen"
					reactionBar={reactionBar}
				/>
			</main>
		</GamePhaseLayout>
	);
}
