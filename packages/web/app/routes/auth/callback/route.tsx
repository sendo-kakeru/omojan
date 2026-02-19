import { honoClient } from "~/libs/apiClient.client";
import { cognito } from "~/libs/cognito";
import type { Route } from "./+types/route";

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

		const { payload } = await cognito.handleOAuthCallback({
			code,
			state,
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
	// TODO: UI
	return (
		<div className="flex min-h-screen items-center justify-center">
			<p>認証中...</p>
		</div>
	);
}

export function HydrateFallback() {
	return <AuthenticatingView />;
}

export default function AuthCallbackPage() {
	return <AuthenticatingView />;
}
