import type { Route } from "./+types/route";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	return (
		<div className="grid">
			<h1>ゲーム結果</h1>
			<p>{gameId}</p>
		</div>
	);
}
