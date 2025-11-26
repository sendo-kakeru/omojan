import type { Route } from "./+types/page";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	return (
		<div className="grid gap-y-12 rounded-lg border border-gray-200 bg-white p-16">
			<h1 className="font-bold text-xl">ゲーム画面</h1>
			<div className="grid gap-y-4">
				<p className="text-gray-500">ゲームID</p>
				<p className="rounded-lg border border-gray-200 bg-gray-50 p-8 font-mono text-lg">
					{gameId}
				</p>
				<p className="text-gray-500 text-sm">ゲーム進行UIは準備中です。</p>
			</div>
		</div>
	);
}
