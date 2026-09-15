import type { Api } from "@repo/api";
import type { FinishedRoom, WaitingRoom } from "@repo/db/model";
import { hc } from "hono/client";
import { useId, useState } from "react";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { cloudflareContext } from "~/libs/cloudflareContext";
import type { Route } from "./+types/route";
import { ActiveRoomBadge } from "./components/ActiveRoomBadge";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { FinishedRoomSection } from "./components/FinishedRoomSection";
import { HeroCreateRoomButton } from "./components/HeroCreateRoomButton";
import { HomeTitle } from "./components/HomeTitle";
import { SocialLinks } from "./components/SocialLinks";
import { WaitingRoomSection } from "./components/WaitingRoomSection";
import { useRoomCountSWR } from "./hooks/useRoomCountSWR";
import { useRoomListSWR } from "./hooks/useRoomListSWR";

const FINISHED_ROOMS_LIMIT = 5;

export async function loader({ context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const client = hc<Api>(env.VITE_API_URL);

	const [waitingRooms, activeRoomCount, finishedRooms] = await Promise.all([
		(async () => {
			const response = await client.v1.rooms.$get({
				query: { limit: 100, status: "waiting" },
			});
			return response.ok ? response.json() : null;
		})(),
		(async () => {
			const response = await client.v1.rooms.count.$get({
				query: { status: "active" },
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
		activeRoomCount,
		finishedRooms,
		waitingRooms,
	};
}

export default function Page({ loaderData }: Route.ComponentProps) {
	const [isOpen, setIsOpen] = useState(false);
	const socialLabelId = useId();

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

	const {
		data: activeCountData,
		isLoading: activeCountLoading,
		mutate: activeCountMutate,
	} = useRoomCountSWR({
		fallbackData: loaderData.activeRoomCount ?? undefined,
		status: "active",
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
			<main className="grid gap-y-32 pb-40">
				<section className="grid animate-rise place-items-center gap-y-24 pt-16 pb-8 text-center sm:pt-24">
					<HomeTitle />
					<div className="grid place-items-center gap-y-16 sm:gap-y-20">
						<ActiveRoomBadge
							count={activeCountData?.count ?? 0}
							isLoading={activeCountLoading}
						/>
						<HeroCreateRoomButton onClick={() => setIsOpen(true)} />
					</div>
				</section>

				<WaitingRoomSection
					error={waitingError}
					isLoading={waitingLoading}
					onCreateRoom={() => setIsOpen(true)}
					onRefresh={() => {
						waitingMutate();
						activeCountMutate();
						finishedMutate();
					}}
					rooms={waitingData?.items as WaitingRoom[] | undefined}
				/>

				<aside
					aria-labelledby={socialLabelId}
					className="grid place-items-center gap-y-12 pt-8"
				>
					<p className="font-bold text-lime-800 text-sm" id={socialLabelId}>
						友達をさそって遊ぼう
					</p>
					<SocialLinks />
				</aside>

				<FinishedRoomSection
					error={finishedError}
					isLoading={finishedLoading}
					rooms={finishedData?.items as FinishedRoom[] | undefined}
				/>
			</main>
			<Footer />
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
