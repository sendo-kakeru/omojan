import type { Api } from "@repo/api";
import type { FinishedRoom, PublicUser } from "@repo/db/model";
import { OFFICIAL_X_ID } from "@repo/shared/constants/config";
import { hc } from "hono/client";
import { FaCrown, FaUser } from "react-icons/fa";
import { FiChevronLeft, FiEdit } from "react-icons/fi";
import { IoGameController } from "react-icons/io5";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Spinner } from "~/components/Spinner";
import { useMe } from "~/context/me/hooks";
import { buildImageUrl, PROFILE_IMAGE_DIMENSIONS } from "~/libs/image";
import { buildNoindexMeta } from "~/libs/meta";
import { useRoomListSWR } from "~/routes/_index/hooks/useRoomListSWR";
import type { Route } from "./+types/route";
import { UserGameSection } from "./components/UserGameSection";
import { USER_GAMES_LIMIT } from "./constants";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

export async function loader({
	params: { userId },
	context,
}: Route.LoaderArgs) {
	const client = hc<Api>(context.cloudflare.env.VITE_API_URL);
	const response = await client.v1.users[":userId"].$get({
		param: { userId },
	});

	if (!response.ok) {
		throw new Response("ユーザーが見つかりません", {
			status: response.status,
		});
	}

	const { data } = await response.json();

	if (!data) {
		throw new Response("ユーザーが見つかりません", { status: 404 });
	}

	return { user: data };
}

export default function UserPage({
	loaderData: { user },
}: Route.ComponentProps) {
	const { me } = useMe();
	const isMe = me?.userId === user.userId;
	const {
		data: gamesData,
		error: gamesError,
		isLoading: gamesLoading,
	} = useRoomListSWR({
		limit: USER_GAMES_LIMIT,
		status: "finished",
		userId: user.userId,
	});

	return (
		<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
			<Header />
			<main className="grid content-start gap-y-24 pb-40">
				<UserProfile user={user} />
				<UserGameSection
					error={gamesError}
					isLoading={gamesLoading}
					rooms={gamesData?.items as FinishedRoom[] | undefined}
					total={gamesData?.meta?.total}
					userId={user.userId}
				/>
			</main>

			{isMe && (
				<p className="text-center text-neutral-400 text-xs">
					退会をご希望の場合は
					<a
						className="underline"
						href={`https://x.com/${OFFICIAL_X_ID}`}
						rel="noopener noreferrer"
						target="_blank"
					>
						公式X
					</a>
					へDMでご連絡ください
				</p>
			)}
			<Footer />
		</div>
	);
}

function UserProfile({ user }: { user: PublicUser }) {
	const { me } = useMe();
	const navigate = useNavigate();
	const isMe = me?.userId === user.userId;

	return (
		<div className="grid gap-y-24">
			<div className="flex justify-between">
				<button
					aria-label="戻る"
					onClick={() => void navigate(-1)}
					type="button"
				>
					<FiChevronLeft className="size-20" />
				</button>

				{isMe && (
					<Button
						as="link"
						color="gray"
						leftIcon={<FiEdit />}
						size="S"
						to={`/users/${user.userId}/edit`}
						variant="outline"
					>
						プロフィールを編集
					</Button>
				)}
			</div>
			<div className="grid place-items-center gap-y-32">
				<div className="grid place-items-center gap-y-24">
					{user.image ? (
						<img
							alt={user.name}
							className="size-96 rounded-full object-cover"
							src={buildImageUrl({
								image: user.image,
								size: PROFILE_IMAGE_DIMENSIONS,
							})}
						/>
					) : (
						<FaUser className="size-96 rounded-full bg-gray-300 p-16 text-gray-500" />
					)}

					<h1 className="font-bold text-xl">{user.name}</h1>
				</div>

				<div className="flex gap-x-32">
					<div className="grid place-items-center gap-y-4">
						<span className="font-bold text-xl">{user.playCount}</span>
						<span className="flex items-center gap-x-4 text-neutral-500 text-sm">
							<IoGameController className="size-16 text-green-500" />
							プレイ
						</span>
					</div>
					<div className="grid place-items-center gap-y-4">
						<span className="font-bold text-xl">{user.winCount}</span>
						<span className="flex items-center gap-x-4 text-neutral-500 text-sm">
							<FaCrown className="size-16 text-yellow-500" />
							勝利
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export function HydrateFallback() {
	return (
		<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
			<Header />
			<main className="grid place-items-center py-80">
				<Spinner className="size-24" />
			</main>
			<Footer />
		</div>
	);
}
