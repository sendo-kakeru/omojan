import type { Api } from "@repo/api";
import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import { hc } from "hono/client";
import { useState } from "react";
import { Header } from "~/components/Header";
import type { Route } from "./+types/route";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { FinishedRoomSection } from "./components/FinishedRoomSection";
import { WaitingRoomSection } from "./components/WaitingRoomSection";
import { useRoomListSWR } from "./hooks/useRoomListSWR";

const FINISHED_ROOMS_LIMIT = 5;

export async function loader({ context }: Route.LoaderArgs) {
	const client = hc<Api>(context.cloudflare.env.VITE_API_URL);

	const [waitingRooms, finishedRooms] = await Promise.all([
		(async () => {
			const response = await client.v1.rooms.$get({
				query: { limit: 100, status: "waiting" },
			});
			return response.ok ? response.json() : null;
		})(),
		(async () => {
			const response = await client.v1.rooms.$get({
				query: { limit: FINISHED_ROOMS_LIMIT, status: "finished" },
			});
			return response.ok ? response.json() : null;
		})(),
	]);

	return {
		finishedRooms,
		waitingRooms,
	};
}

export default function ({ loaderData }: Route.ComponentProps) {
	const [isOpen, setIsOpen] = useState(false);

	// 募集中は全件取得
	const {
		data: waitingData,
		error: waitingError,
		isLoading: waitingLoading,
		mutate: waitingMutate,
	} = useRoomListSWR({
		// 実質全件
		fallbackData: loaderData.waitingRooms ?? undefined,
		limit: 100,
		status: "waiting",
	});

	// 終了した部屋は5件取得
	const {
		data: finishedData,
		error: finishedError,
		isLoading: finishedLoading,
		mutate: finishedMutate,
	} = useRoomListSWR({
		fallbackData: loaderData.finishedRooms ?? undefined,
		limit: FINISHED_ROOMS_LIMIT,
		status: "finished",
	});

	return (
		<>
			<Header />
			<main className="grid gap-y-12 pb-40 sm:mt-24">
				<h1 className="sr-only">おもじゃんオンライン(OMOJAN)</h1>
				<div className="grid gap-y-24">
					<WaitingRoomSection
						error={waitingError}
						handleRefresh={() => {
							waitingMutate();
							finishedMutate();
						}}
						isLoading={waitingLoading}
						onCreateRoom={() => setIsOpen(true)}
						rooms={waitingData?.items as WaitingRoom[] | undefined}
					/>

					<FinishedRoomSection
						error={finishedError}
						isLoading={finishedLoading}
						rooms={finishedData?.items as FinishedRoom[] | undefined}
					/>
				</div>
			</main>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
