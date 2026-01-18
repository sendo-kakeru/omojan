import type { GameResultResponseBody } from "@repo/db/model";
import classNames from "classnames";
import { FaCrown } from "react-icons/fa";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { useMe } from "~/context/me/hooks";

export type GameFinalResultProps = {
	result: GameResultResponseBody;
};

export function GameFinalResult({ result }: GameFinalResultProps) {
	const { me } = useMe();
	const { winners, rounds } = result;

	return (
		<main className="grid min-h-full gap-y-24 pt-16 pb-36">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-lg">最終結果</h1>
				<Button as="link" to="/">
					トップに戻る
				</Button>
			</div>
			<div className="grid gap-y-4">
				<section className="grid place-items-center gap-y-12 rounded-2xl border-1 border-yellow-300 bg-yellow-100 p-16 shadow">
					<div className="flex items-center gap-x-8">
						<FaCrown className="size-20 text-yellow-500" />
						<h2 className="font-bold text-yellow-700">優勝者</h2>
						<FaCrown className="size-20 text-yellow-500" />
					</div>
					<div className="flex flex-wrap justify-center gap-16">
						{winners.map((winner) => (
							<div className="grid place-items-center" key={winner.id}>
								<div className="relative">
									<Avatar
										name={winner.playerName}
										size="L"
										src={winner.image ?? undefined}
									/>
									{me && winner.userId === me.userId && (
										<Badge
											className="absolute -bottom-2/5 left-1/2 -translate-x-1/2"
											color="primary"
										>
											自分
										</Badge>
									)}
								</div>
								<p className="mt-20 font-bold text-sm">{winner.playerName}</p>
								<p className="font-medium text-sm text-yellow-600">
									{winner.winCount}勝
								</p>
							</div>
						))}
					</div>
				</section>
			</div>

			{/* Round History */}
			<section className="grid gap-y-4">
				<h2 className="font-bold text-neutral-700">ラウンド結果</h2>
				<div className="grid gap-y-12">
					{rounds.map((round) => {
						return (
							<div
								className="overflow-hidden rounded-xl border border-gray-200 bg-white"
								key={round.roundNo}
							>
								{/* Round Header */}
								<div className="flex items-center gap-x-12 border-gray-100 border-b bg-gray-50 px-16 py-8">
									<span className="flex size-28 items-center justify-center rounded-full bg-green-600 font-bold text-white">
										{round.roundNo}
									</span>
									<p className="font-bold text-lg">{round.theme}</p>
								</div>
								{/* Round Content */}
								<div className="grid gap-y-8 p-16">
									{round.players.map((player) => {
										return (
											<div
												className={classNames(
													"grid gap-y-4 rounded-lg px-12 py-8 md:flex md:items-center md:gap-x-16",
													player.isWinner
														? "border border-yellow-300 bg-yellow-50"
														: "bg-gray-50",
												)}
												key={player.id}
											>
												<div className="flex items-center gap-x-4 md:gap-x-8">
													<Avatar
														name={player.playerName}
														size="S"
														src={player.image ?? undefined}
													/>
													<p className="flex-1 text-xs md:flex-none">
														{player.playerName}
														{me && player.userId === me.userId && (
															<span className="text-neutral-400">（自分）</span>
														)}
													</p>
													{player.isWinner && (
														<FaCrown className="size-16 text-yellow-500 md:hidden" />
													)}
												</div>
												<p
													className={classNames(
														"font-bold md:flex-1",
														player.isWinner && "text-yellow-700",
													)}
												>
													{player.submission}
												</p>
												{player.isWinner && (
													<FaCrown className="hidden size-16 text-yellow-500 md:block" />
												)}
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</section>

			{/* Actions */}
			<section className="grid gap-y-12">
				<Button
					as="link"
					className="mx-auto w-full max-w-240"
					color="primary"
					size="L"
					to="/"
				>
					トップに戻る
				</Button>
			</section>
		</main>
	);
}
