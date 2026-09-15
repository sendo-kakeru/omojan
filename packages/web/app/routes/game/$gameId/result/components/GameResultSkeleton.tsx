import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Tile } from "~/components/Tile";

export function GameResultSkeleton() {
	return (
		<>
			<Header />
			<main className="grid animate-pulse gap-y-24 pb-36">
				<span className="sr-only">ゲーム結果を読み込み中</span>

				{/* 優勝者セクション */}
				<Tile
					className="grid place-items-center gap-y-12 p-16"
					thickness="amber"
				>
					<div className="h-26 w-160 rounded-full bg-cream-200" />
					<div className="h-20 w-64 rounded-full bg-cream-200" />
					<div className="grid place-items-center gap-y-8">
						<div className="size-40 rounded-full bg-cream-200" />
						<div className="mt-20 h-16 w-120 rounded-full bg-cream-200" />
						<div className="h-14 w-32 rounded-full bg-cream-200" />
					</div>
				</Tile>

				{/* ソーシャルボタン */}
				<div className="flex items-center justify-center gap-x-12">
					<div className="h-28 w-102 rounded-full bg-cream-200" />
					<div className="h-28 w-78 rounded-full bg-cream-200" />
				</div>

				{/* ラウンド結果 */}
				<section className="grid gap-y-8">
					<div className="h-20 w-100 rounded-full bg-cream-200" />
					<div className="grid gap-y-12">
						{[1, 2].map((round) => (
							<Tile className="overflow-hidden p-0" key={round}>
								<div className="flex items-center gap-x-12 border-cream-200 border-b bg-cream-100/70 px-16 py-8">
									<div className="size-28 rounded-full bg-cream-200" />
									<div className="h-20 w-120 rounded-full bg-cream-200" />
								</div>
								<div className="grid gap-y-8 p-16">
									{[1, 2, 3, 4].map((player) => (
										<div
											className="flex items-center gap-x-8 rounded-lg bg-cream-100/60 px-12 py-8"
											key={player}
										>
											<div className="size-24 rounded-full bg-cream-200" />
											<div className="h-14 w-64 rounded-full bg-cream-200" />
											<div className="h-16 w-80 rounded-full bg-cream-200" />
										</div>
									))}
								</div>
							</Tile>
						))}
					</div>
				</section>

				{/* トップに戻るボタン */}
				<div className="mx-auto h-44 w-full max-w-240 rounded-full bg-cream-200" />
			</main>
			<Footer />
		</>
	);
}
