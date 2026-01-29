import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import { useState } from "react";
import { Header } from "~/components/Header";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { FinishedRoomSection } from "./components/FinishedRoomSection";
import { WaitingRoomSection } from "./components/WaitingRoomSection";
import { useRoomListSWR } from "./hooks/useRoomListSWR";

const FINISHED_ROOMS_LIMIT = 5;

export default function () {
	const [isOpen, setIsOpen] = useState(false);

	// 募集中は全件取得
	const {
		data: waitingData,
		error: waitingError,
		isLoading: waitingLoading,
		mutate: waitingMutate,
	} = useRoomListSWR({
		// 実質全件
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
		limit: FINISHED_ROOMS_LIMIT,
		status: "finished",
	});

	return (
		<>
			<Header />
			<main className="grid gap-y-12 pt-24 pb-40">
				<h1 className="sr-only">おもじゃんオンライン</h1>
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
