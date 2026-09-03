import type { GameServerResultMessage } from "@repo/db/model";
import classNames from "classnames";
import { useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
import { tileClassName } from "~/components/Tile";
import { useCountdown } from "~/hooks/useCountdown";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";
import { createCombination } from "../libs/gameUtils";
import { GamePhaseLayout } from "./GamePhaseLayout";
import { GamePhaseNav } from "./GamePhaseNav";
import { PlayerCardDisplay } from "./PlayerCardDisplay";

export function GameResult({ data }: { data: GameServerResultMessage }) {
	const { game, mePlayer } = data;
	const { count, progress, start: startCountdown } = useCountdown();

	useEffect(() => {
		startCountdown(6);
	}, [startCountdown]);

	return (
		<GamePhaseLayout
			nav={
				<GamePhaseNav
					messageVariant="inactive"
					roundNo={game.roundNo}
					timerCount={count}
					timerProgress={progress}
				/>
			}
		>
			<main className="grid grid-rows-[1fr_auto]">
				{/* プレイヤー結果エリア */}
				<section className="relative my-auto grid h-fit content-center gap-y-4 rounded-lg">
					{/* 結果表示ラベル */}
					<p className="mb-12 text-center font-bold text-moss">
						ラウンド {game.roundNo} の結果
					</p>
					{game.players.map((player) => {
						const isWinner = game.winnerPlayerIds.includes(player.id);
						const isSelf = player.id === mePlayer.id;
						const combination = createCombination({
							position: player.submission?.position,
							text: player.submission?.text,
							theme: game.theme,
						});

						return (
							<div className="relative w-full" key={player.id}>
								<div
									className={tileClassName({
										className: classNames(
											"flex w-full animate-place-tile items-center gap-x-12 px-12 py-8 motion-reduce:animate-none md:py-12",
											isWinner &&
												"animate-glow bg-gold/20 motion-reduce:animate-none",
										),
										stand: isWinner ? "gold" : "ivory",
									})}
								>
									<div className="grid flex-1 gap-y-2">
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
												<FaCrown className="size-20 text-gold-deep" />
											)}
											<p className="font-bold text-neutral-500 text-xs">
												{player.playerName}
												{isSelf && (
													<span className="font-normal text-neutral-400">
														（自分）
													</span>
												)}
											</p>
										</div>
										<p className="font-bold text-base text-carved text-moss md:text-lg">
											{combination}
										</p>
									</div>
									{/* 固定幅でバッジの位置を安定させる */}
									<div className="grid w-64 place-items-center">
										<p
											className={classNames(
												"whitespace-nowrap rounded-full border-2 px-12 py-2 font-bold text-sm",
												isWinner
													? "border-gold-deep bg-gold text-moss"
													: "border-moss/30 bg-moss/10 text-moss",
											)}
										>
											{player.voteCount}票
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</section>

				<PlayerCardDisplay cards={mePlayer.playerCards} />
			</main>
		</GamePhaseLayout>
	);
}
