import type { GameResultResponseBody } from "@repo/db/model";
import { OFFICIAL_X_ID } from "@repo/shared/constants/config";
import classNames from "classnames";
import { FaCrown } from "react-icons/fa";
import { Link } from "react-router";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { XFollowButton } from "~/components/button/XFollowButton";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { useMe } from "~/context/me/hooks";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";

export type GameFinalResultProps = {
	result: GameResultResponseBody;
};

export function GameFinalResult({
	result: { title, winners, rounds },
}: GameFinalResultProps) {
	const { me } = useMe();

	return (
		<>
			<Header />
			<main className="grid min-h-full gap-y-24 pb-36">
				<div className="grid gap-y-4">
					<section className="grid place-items-center gap-y-12 rounded-2xl border border-yellow-300 bg-yellow-100 p-16 shadow">
						<h1 className="font-bold text-lg text-neutral-600">{title}</h1>
						<div className="flex items-center gap-x-8">
							<FaCrown className="size-20 text-yellow-500" />
							<h2 className="font-bold text-yellow-700">優勝者</h2>
							<FaCrown className="size-20 text-yellow-500" />
						</div>
						<div className="flex flex-wrap justify-center gap-16">
							{winners.map((winner) => {
								const winnerContent = (
									<>
										<div className="relative">
											<Avatar
												name={winner.playerName}
												size="L"
												src={buildImageUrl({
													image: winner.image,
													size: AVATAR_IMAGE_DIMENSIONS.L,
												})}
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
										<p className="mt-20 font-bold text-sm">
											{winner.playerName}
										</p>
										<p className="font-medium text-sm text-yellow-600">
											{winner.winCount}勝
										</p>
									</>
								);
								return winner.userId ? (
									<Link
										className="grid place-items-center"
										key={winner.id}
										to={`/users/${winner.userId}`}
									>
										{winnerContent}
									</Link>
								) : (
									<div className="grid place-items-center" key={winner.id}>
										{winnerContent}
									</div>
								);
							})}
						</div>
					</section>
				</div>

				<aside className="grid place-items-center gap-y-8 rounded-xl border border-gray-200 bg-white p-16">
					<div className="grid gap-y-4 text-center">
						<p className="font-bold text-neutral-700">
							最新情報は公式Xをチェック
						</p>
						<p className="text-neutral-500 text-sm">
							不具合の報告や追加してほしい単語など
							<br />
							お気軽にご連絡ください
						</p>
					</div>
					<XFollowButton
						options={{ lang: "ja", showScreenName: false, size: "large" }}
						username={OFFICIAL_X_ID}
					/>
				</aside>

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
											const playerInfo = (
												<>
													<Avatar
														name={player.playerName}
														size="S"
														src={buildImageUrl({
															image: player.image,
															size: AVATAR_IMAGE_DIMENSIONS.S,
														})}
													/>
													<p className="flex-1 text-xs md:flex-none">
														{player.playerName}
														{me && player.userId === me.userId && (
															<span className="text-neutral-400">（自分）</span>
														)}
													</p>
												</>
											);
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
														{player.userId ? (
															<Link
																className="flex items-center gap-x-4 md:gap-x-8"
																to={`/users/${player.userId}`}
															>
																{playerInfo}
															</Link>
														) : (
															playerInfo
														)}
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
						replace
						size="L"
						to="/"
					>
						トップに戻る
					</Button>
				</section>
			</main>
			<Footer />
		</>
	);
}
