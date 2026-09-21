import type { Api } from "@repo/api";
import { hc } from "hono/client";
import { InPageError } from "~/components/InPageError";
import { Spinner } from "~/components/Spinner";
import { cognito } from "~/libs/cognito";
import { buildNoindexMeta } from "~/libs/meta";
import type { Route } from "./+types/route";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

/**
 * プロバイダから来た名前を userNameSchema が通る形に整える
 */
function buildInitialUserName({
	email,
	name,
}: {
	email: string;
	name?: string;
}): string {
	const candidate = name?.trim() || email.split("@")[0]?.trim() || email;
	return candidate.slice(0, 50);
}

type AuthCallbackError = "deactivated" | "unauthorized" | "unknown";

const AUTH_CALLBACK_ERRORS: Record<
	AuthCallbackError,
	{ description: string; heading: string }
> = {
	deactivated: {
		description:
			"このアカウントは無効化されています。心当たりがない場合はお問い合わせください。",
		heading: "アカウントを利用できません",
	},
	unauthorized: {
		description:
			"認証情報を確認できませんでした。お手数ですが、再度ログインしてください。",
		heading: "ログインに失敗しました",
	},
	unknown: {
		description:
			"ログインの途中で問題が発生しました。時間を置いて再度お試しください。",
		heading: "ログインに失敗しました",
	},
};

type AuthCallbackResult = { error: AuthCallbackError | null };

export async function clientLoader({
	request,
}: Route.LoaderArgs): Promise<AuthCallbackResult> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const oauthError = url.searchParams.get("error");

	// code と state は取得済みなので、この時点でURL削除
	window.history.replaceState(null, "", url.pathname);

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

		// 登録済みならトップへ
		if (getMeResponse.ok) {
			window.location.href = "/";
			return { error: null };
		}

		// 404 のみが初回ログイン。それ以外は登録に進まず理由を表示する
		if (getMeResponse.status === 403) return { error: "deactivated" };
		if (getMeResponse.status === 401) return { error: "unauthorized" };
		if (getMeResponse.status !== 404) {
			throw new Error(`Meの取得に失敗しました: ${getMeResponse.status}`);
		}

		const createMeResponse = await honoClient.v1.me.$post({
			json: {
				email: payload.email,
				image: payload.picture,
				name: buildInitialUserName({
					email: payload.email,
					name: payload.name,
				}),
			},
		});
		const createdMeResult = await createMeResponse.json();
		if (!createdMeResult.data) {
			throw new Error(
				createdMeResult.message || "ユーザーの作成に失敗しました",
			);
		}

		window.location.href = "/";
		return { error: null };
	} catch (error) {
		console.error("認証後の処理に失敗しました:", error);
		return { error: "unknown" };
	}
}

function AuthenticatingView() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-y-24">
			<img
				alt="おもじゃんオンライン"
				className="size-80 animate-bounce rounded-md"
				src="/icons/omojan.webp"
			/>
			<div className="flex items-center gap-x-8 text-lime-800">
				<Spinner className="size-20" />
				<p className="font-bold text-sm">ログインしています…</p>
			</div>
		</div>
	);
}

export function HydrateFallback() {
	return <AuthenticatingView />;
}

export default function AuthCallbackPage({ loaderData }: Route.ComponentProps) {
	if (loaderData.error) {
		const { description, heading } = AUTH_CALLBACK_ERRORS[loaderData.error];
		return (
			<InPageError
				description={description}
				heading={heading}
				replaceNavigation
				showLogo
			/>
		);
	}

	return <AuthenticatingView />;
}
