import { uuid58Encode } from "@nakanoaas/uuid58";
import type { GameResultResponseBody } from "@repo/db/model";
import {
	OFFICIAL_X_ID,
	PROD_SITE_URL,
	SITE_NAME,
} from "@repo/shared/constants/config";
import classNames from "classnames";
import { FaCrown } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { IoMdShare } from "react-icons/io";
import { Link } from "react-router";
import { Avatar } from "~/components/Avatar";
import { Badge } from "~/components/Badge";
import { Button } from "~/components/button/Button";
import { Confetti } from "~/components/Confetti";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { tileClassName } from "~/components/Tile";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/Tooltip";
import { useMe } from "~/context/me/hooks";
import { useShare } from "~/hooks/useShare";
import { AVATAR_IMAGE_DIMENSIONS, buildImageUrl } from "~/libs/image";

function buildXShareUrl({
	submission,
	theme,
}: {
	submission: string;
	theme: string;
}): string {
	const text = [
		`「${submission}」`,
		"",
		`お題「${theme}」で文字を組み合わせて作った造語です🀄`,
		PROD_SITE_URL,
		"",
		"#おもじゃんオンライン #おもじゃん #OMOJAN",
	].join("\n");
	const url = new URL("https://x.com/intent/tweet");
	url.searchParams.set("text", text);
	return url.toString();
}

export type GameFinalResultProps = {
	result: GameResultResponseBody;
};

export function GameFinalResult({
	result: { title, winners, rounds },
}: GameFinalResultProps) {
	const { me } = useMe();
	const { share } = useShare({
		text: "一緒に遊ぼう！",
		title: SITE_NAME,
		url: PROD_SITE_URL,
	});

	return (
		<>
			<Header />
			<Confetti />
			<main className="grid gap-y-24 pb-36">
				<div className="grid gap-y-4">
					<section
						className={tileClassName({
							className:
								"grid animate-place-tile place-items-center gap-y-12 p-16 motion-reduce:animate-none",
							stand: "gold",
						})}
					>
						<h1 className="font-bold text-base text-neutral-500">{title}</h1>
						<div className="flex items-center gap-x-8">
							<FaCrown className="size-20 text-gold-deep" />
							<h2 className="font-bold text-carved text-lg text-moss">優勝</h2>
							<FaCrown className="size-20 text-gold-deep" />
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
										<p className="font-bold text-moss text-sm">
											{winner.winCount}勝
										</p>
									</>
								);
								return winner.userId ? (
									<Link
										className="grid place-items-center"
										key={winner.id}
										to={`/users/${uuid58Encode(winner.userId)}`}
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

				<aside className="flex items-center justify-center gap-x-12">
					<a
						className="flex h-28 items-center gap-x-8 rounded-full bg-neutral-800 pr-16 pl-12 font-bold text-white text-xs transition-opacity hover:opacity-80"
						href={`https://x.com/${OFFICIAL_X_ID}`}
						rel="noopener noreferrer"
						target="_blank"
					>
						<FaXTwitter className="size-18" />
						フォロー
					</a>
					<button
						className="flex h-28 items-center gap-x-8 rounded-full bg-brand-deep pr-16 pl-12 font-bold text-white text-xs transition-colors hover:bg-brand-darker"
						onClick={share}
						type="button"
					>
						<IoMdShare className="size-18" />
						共有
					</button>
				</aside>

				{/* Round History */}
				<section className="grid gap-y-4">
					<h2 className="font-bold text-moss">ラウンド結果</h2>
					<div className="grid gap-y-12">
						{rounds.map((round) => {
							return (
								<div
									className={tileClassName({
										className: "overflow-hidden p-0",
									})}
									key={round.roundNo}
								>
									{/* Round Header */}
									<div className="flex items-center gap-x-12 border-ivory-edge border-b bg-mat/70 px-16 py-8">
										<span className="flex size-28 items-center justify-center rounded-full bg-moss font-display text-sm text-white">
											{round.roundNo}
										</span>
										<p className="font-bold text-base text-moss">
											{round.theme}
										</p>
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
															? "border-2 border-gold bg-gold/15"
															: "bg-mat/60",
													)}
													key={player.id}
												>
													<div className="flex items-center gap-x-4 pr-3 md:gap-x-8 md:pr-0">
														{player.userId ? (
															<Link
																className="flex items-center gap-x-4 md:gap-x-8"
																to={`/users/${uuid58Encode(player.userId)}`}
															>
																{playerInfo}
															</Link>
														) : (
															playerInfo
														)}
														{player.isWinner && (
															<FaCrown className="size-16 text-gold-deep md:hidden" />
														)}
													</div>
													{player.isWinner && (
														<FaCrown className="hidden size-16 text-gold-deep md:block" />
													)}
													<div className="flex items-center gap-x-4 md:contents">
														<p
															className={classNames(
																"flex-1 font-bold",
																player.isWinner
																	? "text-moss"
																	: "text-neutral-700",
															)}
														>
															{player.submission}
														</p>
														<Tooltip>
															<TooltipTrigger asChild>
																<a
																	aria-label="Xで共有する"
																	className="grid shrink-0 place-items-center rounded-full bg-black p-4 text-white transition-colors hover:bg-gray-700"
																	href={buildXShareUrl({
																		submission: player.submission,
																		theme: round.theme,
																	})}
																	rel="noopener noreferrer"
																	target="_blank"
																>
																	<FaXTwitter className="size-14" />
																</a>
															</TooltipTrigger>
															<TooltipContent>Xで共有する</TooltipContent>
														</Tooltip>
													</div>
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
						color="brand"
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
