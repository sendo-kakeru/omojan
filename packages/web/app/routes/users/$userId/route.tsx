import type { Api } from "@repo/api";
import type { PublicUser } from "@repo/db/model";
import { hc } from "hono/client";
import { FaUser } from "react-icons/fa";
import { FiChevronLeft, FiEdit } from "react-icons/fi";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { Spinner } from "~/components/Spinner";
import { useMe } from "~/context/me/hooks";
import type { Route } from "./+types/route";

export async function loader({
	params: { userId },
	context,
}: Route.LoaderArgs) {
	const client = hc<Api>(context.cloudflare.env.VITE_API_URL);
	const response = await client.v1.users[":userId"].$get({
		param: { userId },
	});

	if (!response.ok) {
		throw new Response("ユーザーが見つかりません", { status: 404 });
	}

	const { data } = await response.json();

	if (!data) {
		throw new Response("ユーザーの取得に失敗しました", { status: 500 });
	}

	return { user: data };
}

export default function UserPage({
	loaderData: { user },
}: Route.ComponentProps) {
	return (
		<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
			<Header />
			<main className="grid content-start gap-y-24 pb-40">
				<UserProfile user={user} />
			</main>
			<Footer />
		</div>
	);
}

function UserProfile({ user }: { user: PublicUser }) {
	const { me } = useMe();
	const navigate = useNavigate();
	const isMe = me?.userId === user.userId;

	return (
		<div className="grid">
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
						to={`/users/${user.userId}/edit`}
						variant="outline"
					>
						プロフィールを編集
					</Button>
				)}
			</div>
			<div className="grid place-items-center gap-y-20 py-24">
				{user.image ? (
					<img
						alt={user.name}
						className="size-96 rounded-full object-cover"
						src={user.image}
					/>
				) : (
					<FaUser className="size-96 rounded-full bg-gray-300 p-16 text-gray-500" />
				)}

				<h1 className="font-bold text-xl">{user.name}</h1>

				<div className="flex gap-x-32">
					<div className="grid place-items-center gap-y-2">
						<span className="font-bold text-xl">{user.playCount}</span>
						<span className="text-neutral-500 text-sm">プレイ</span>
					</div>
					<div className="grid place-items-center gap-y-2">
						<span className="font-bold text-xl">{user.winCount}</span>
						<span className="text-neutral-500 text-sm">勝利</span>
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
