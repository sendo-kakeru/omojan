import type { Api } from "@repo/api";
import { hc } from "hono/client";
import { Spinner } from "~/components/Spinner";
import { cognito } from "~/libs/cognito";
import { buildNoindexMeta } from "~/libs/meta";
import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

// TODO: UI
export async function clientLoader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const oauthError = url.searchParams.get("error");
	try {
		if (oauthError) {
			throw new Error(`OAuth error: ${oauthError}`);
		}

		const { accessToken, payload } = await cognito.handleOAuthCallback({
			code,
			state,
		});

		// handleOAuthCallbackから返されたトークンを直接使用する
		// CognitoUserPool経由でのトークン取得はSafari ITPによりlocalStorageが即座に利用できない場合があるため、初回ログイン時に失敗する可能性がある
		const honoClient = hc<Api>(import.meta.env.VITE_API_URL, {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		const getMeResponse = await honoClient.v1.me.$get();
		const getMeResult = await getMeResponse.json();
		// 初回ログインでなければトップへ
		if (getMeResult.data) {
			window.location.href = "/";
			return;
		}

		const createMeResponse = await honoClient.v1.me.$post({
			json: {
				email: payload.email,
				image: payload.picture,
				name: payload.name ?? payload.email.split("@")[0] ?? payload.email,
			},
		});
		const createdMeResult = await createMeResponse.json();
		if (!createdMeResult.data) {
			throw new Error(
				createdMeResult.message || "ユーザーの作成に失敗しました",
			);
		}
	} catch (error) {
		console.error("認証後の処理に失敗しました:", error);
		alert("認証後の処理に失敗しました");
	} finally {
		window.location.href = "/";
	}
}

function AuthenticatingView() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-y-24">
			<img
				alt="おもじゃんオンライン"
				className="size-80 animate-bounce"
				src="/icons/omojan.webp"
			/>
			<div className="flex items-center gap-x-8">
				<Spinner className="size-20 text-gray-500" />
				<p className="font-medium text-14 text-neutral-600">
					ログインしています…
				</p>
			</div>
		</div>
	);
}

export function HydrateFallback() {
	return <AuthenticatingView />;
}

export default function AuthCallbackPage() {
	return <AuthenticatingView />;
}
