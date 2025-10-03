import { Button } from "~/components/button/Button";
import { useToast } from "~/components/Toast";
import { cognitoService } from "~/libs/cognito";
import type { Route } from "./+types/page";

export async function clientLoader() {
	const accessToken = await cognitoService.getAccessToken();
	console.log("accessToken:", accessToken);
	return { accessToken };
}

export default function Home({
	loaderData: { accessToken },
}: Route.ComponentProps) {
	const { showToast } = useToast();
	const handleSignOut = () => {
		try {
			cognitoService.signOut();
		} catch (error) {
			console.error("ログアウトに失敗しました:", error);
			showToast({ title: "ログアウトに失敗しました。", type: "error" });
		}
	};

	return (
		<div className="w-full bg-white p-8">
			{accessToken && (
				<Button as="button" onClick={() => handleSignOut()} type="button">
					ログアウト
				</Button>
			)}
			<p>hello</p>
		</div>
	);
}
