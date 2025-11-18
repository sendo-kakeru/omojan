import type { Route } from "./+types/page";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	return <p>matching page: {gameId}</p>;
}
