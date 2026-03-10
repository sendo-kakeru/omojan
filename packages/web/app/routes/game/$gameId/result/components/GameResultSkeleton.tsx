import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";

export function GameResultSkeleton() {
	return (
		<>
			<Header />
			<main className="grid animate-pulse gap-y-24 pb-36">
				<span className="sr-only">ゲーム結果を読み込み中</span>

				{/* 優勝者セクション */}
				<section className="grid place-items-center gap-y-12 rounded-2xl border border-yellow-300 bg-yellow-100 p-16 shadow">
					<div className="h-26 w-160 rounded-full bg-yellow-200" />
					<div className="h-20 w-64 rounded-full bg-yellow-200" />
					<div className="grid place-items-center gap-y-8">
						<div className="size-40 rounded-full bg-yellow-200" />
						<div className="mt-20 h-16 w-120 rounded-full bg-yellow-200" />
						<div className="h-14 w-32 rounded-full bg-yellow-200" />
					</div>
				</section>

				{/* ソーシャルボタン */}
				<div className="flex items-center justify-center gap-x-12">
					<div className="h-28 w-102 rounded-full bg-neutral-200" />
					<div className="h-28 w-78 rounded-full bg-neutral-200" />
					<div className="h-28 w-78 rounded-full bg-neutral-200" />
				</div>

				{/* ラウンド結果 */}
				<section className="grid gap-y-8">
					<div className="h-20 w-100 rounded-full bg-neutral-200" />
					<div className="grid gap-y-12">
						{[1, 2].map((round) => (
							<div
								className="overflow-hidden rounded-xl border border-gray-200 bg-white"
								key={round}
							>
								<div className="flex items-center gap-x-12 border-gray-100 border-b bg-gray-50 px-16 py-8">
									<div className="size-28 rounded-full bg-neutral-200" />
									<div className="h-20 w-120 rounded-full bg-neutral-200" />
								</div>
								<div className="grid gap-y-8 p-16">
									{[1, 2, 3, 4].map((player) => (
										<div
											className="flex items-center gap-x-8 rounded-lg bg-gray-50 px-12 py-8"
											key={player}
										>
											<div className="size-24 rounded-full bg-neutral-200" />
											<div className="h-14 w-64 rounded-full bg-neutral-200" />
											<div className="h-16 w-80 rounded-full bg-neutral-200" />
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</section>

				{/* トップに戻るボタン */}
				<div className="mx-auto h-44 w-full max-w-240 rounded-full bg-neutral-200" />
			</main>
			<Footer />
		</>
	);
}
