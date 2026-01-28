import { InPageError } from "./InPageError";

const ERROR_CONFIG = {
	401: {
		description: "このページにアクセスするにはログインが必要です。",
		heading: "認証が必要です",
	},
	403: {
		description: "このページにアクセスする権限がありません。",
		heading: "アクセスが拒否されました",
	},
	404: {
		description: "お探しのページは存在しないか、移動した可能性があります。",
		heading: "ページが見つかりません",
	},
	500: {
		description:
			"予期しないエラーが発生しました。時間をおいて再度お試しください。",
		heading: "サーバーエラー",
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
		<InPageError
			description={config.description}
			heading={config.heading}
			showHomeButton={showHomeButton}
			showLogo
		/>
	);
}
