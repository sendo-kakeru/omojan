import type { GameServerResultMessage } from "@repo/db/model";
import classNames from "classnames";
import { useEffect } from "react";
import { FaCrown } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
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
				<section className="relative my-auto grid h-fit content-center rounded-lg">
					{/* 結果表示ラベル */}
					<p className="mb-12 text-center font-semibold text-neutral-600">
						ラウンド {game.roundNo} 結果
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
									className={classNames(
										"flex w-full items-center gap-x-12 rounded-lg px-12 py-8 md:py-12",
										isWinner
											? "border-2 border-yellow-400 bg-yellow-50"
											: "border border-gray-200 bg-white",
									)}
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
												<FaCrown className="size-20 text-yellow-500" />
											)}
											<p className="font-semibold text-neutral-400 text-xs">
												{player.playerName}
												{isSelf && (
													<span className="text-neutral-400">（自分）</span>
												)}
											</p>
										</div>
										<p className="font-bold text-base md:text-lg">
											{combination}
										</p>
									</div>
									{/* 固定幅でバッジの位置を安定させる */}
									<div className="grid w-64 place-items-center">
										<p className="whitespace-nowrap rounded-full border-2 border-green-200 bg-green-100 px-12 py-2 font-medium text-green-700 text-sm">
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
