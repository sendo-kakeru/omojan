import { IoHomeOutline } from "react-icons/io5";
import { Button } from "./button/Button";

const ERROR_CONFIG = {
	401: {
		description: "このページにアクセスするにはログインが必要です。",
		heading: "認証が必要です",
		title: "401",
	},
	403: {
		description: "このページにアクセスする権限がありません。",
		heading: "アクセスが拒否されました",
		title: "403",
	},
	404: {
		description: "お探しのページは存在しないか、移動した可能性があります。",
		heading: "ページが見つかりません",
		title: "404",
	},
	500: {
		description:
			"予期しないエラーが発生しました。時間をおいて再度お試しください。",
		heading: "サーバーエラー",
		title: "500",
	},
} as const;

export function ErrorPage({
	statusCode,
	showHomeButton = true,
}: {
	statusCode: 401 | 403 | 404 | 500;
	showHomeButton?: boolean;
}) {
	const config = ERROR_CONFIG[statusCode];

	return (
		<div className="flex min-h-svh items-center justify-center px-16">
			<div className="grid max-w-560 place-items-center gap-y-24 text-center">
				<div className="grid place-items-center gap-y-8">
					{/* TODO: R2の設定をしたらそこからリサイズして取得するようにする */}
					<img
						alt="おもじゃんオンライン"
						height={100}
						src="/logo.png"
						width={100}
					/>
					<h1 className="font-bold text-2xl text-neutral-800">
						{config.heading}
					</h1>
					<p className="text-neutral-500">{config.description}</p>
				</div>
				{showHomeButton && (
					<Button as="link" leftIcon={<IoHomeOutline />} to="/">
						ホームに戻る
					</Button>
				)}
			</div>
		</div>
	);
}
