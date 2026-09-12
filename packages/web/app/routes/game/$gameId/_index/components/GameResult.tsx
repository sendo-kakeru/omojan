import type { GameServerResultMessage } from "@repo/db/model";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
import { Tile } from "~/components/Tile";
import { useCountdown } from "~/hooks/useCountdown";
import { getDisplayName } from "~/libs/displayName";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

export function GameResult({
	data,
	reactionBar,
}: {
	data: GameServerResultMessage;
	reactionBar?: ReactNode;
}) {
	const { game, mePlayer } = data;
	const { count, progress, start: startCountdown } = useCountdown();

	useEffect(() => {
		startCountdown(6);
	}, [startCountdown]);

	// 得票数の多い順に並べる
	const rankedPlayers = [...game.players].sort(
		(a, b) => b.voteCount - a.voteCount,
	);

	return (
		<GamePhaseLayout
			nav={
				<GamePhaseNav
					roundNo={game.roundNo}
					timerCount={count}
					timerProgress={progress}
				/>
			}
		>
			<main className="grid grid-rows-[1fr_auto]">
				{/* プレイヤー結果エリア */}
				<section className="relative my-auto grid h-fit content-center gap-y-4 rounded-lg">
					<div className="mb-12 grid justify-items-center gap-y-2">
						<p className="text-center font-bold text-lime-800">
							ラウンド {game.roundNo} の結果
						</p>
						<p className="text-center text-neutral-500 text-xs">
							お題「{game.theme}」
						</p>
					</div>
					{rankedPlayers.map((player, index) => {
						const isWinner = game.winnerPlayerIds.includes(player.id);
						const isSelf = player.id === mePlayer.id;
						const combination = createCombination({
							position: player.submission?.position,
							text: player.submission?.text,
							theme: game.theme,
						});

						// 牌が置かれる演出をずらして表示し、勝者は間を置いて光らせる
						const placeTileDelayMs = index * 90;
						const glowDelayMs = placeTileDelayMs + 500;

						return (
							<div className="relative w-full" key={player.id}>
								<Tile
									className={classNames(
										"flex w-full items-center gap-x-12 px-12 py-8 motion-reduce:animate-none md:py-12",
										isWinner
											? "animate-place-tile-winner bg-amber-300/20"
											: "animate-place-tile",
									)}
									style={{
										animationDelay: isWinner
											? `${placeTileDelayMs}ms, ${glowDelayMs}ms`
											: `${placeTileDelayMs}ms`,
									}}
									thickness={isWinner ? "amber" : "cream"}
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
											{isWinner && (
												<FaCrown className="size-20 text-amber-500" />
											)}
											<p className="font-bold text-neutral-500 text-xs">
												{getDisplayName(player.playerName)}
												{isSelf && (
													<span className="font-normal text-neutral-400">
														（自分）
													</span>
												)}
											</p>
										</div>
										<p className="wrap-break-word carved-text font-bold text-lime-800 text-sm md:text-base">
											{combination}
										</p>
									</div>
									{/* 固定幅でバッジの位置を安定させる */}
									<div className="grid w-64 place-items-center">
										<p
											className={classNames(
												"whitespace-nowrap rounded-full border-2 px-12 py-2 font-bold text-sm",
												isWinner
													? "border-amber-500 bg-amber-300 text-lime-800"
													: "border-lime-800/30 bg-lime-800/10 text-lime-800",
											)}
										>
											{player.voteCount}票
										</p>
									</div>
								</Tile>
							</div>
						);
					})}
				</section>

				<PlayerCardDisplay
					cards={mePlayer.playerCards}
					className="-mx-16 w-[calc(100%+32px)]"
					reactionBar={reactionBar}
				/>
			</main>
		</GamePhaseLayout>
	);
}
