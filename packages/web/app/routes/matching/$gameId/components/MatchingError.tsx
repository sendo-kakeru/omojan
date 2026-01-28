import { InPageError } from "~/components/InPageError";

export type MatchingErrorType =
	| "notFound"
	| "forbidden"
	| "unauthorized"
	| "connectionError";

const ERROR_CONFIG: Record<
	MatchingErrorType,
	{ description: string; heading: string }
> = {
	connectionError: {
		description: "部屋への接続に失敗しました。時間をおいて再度お試しください。",
		heading: "接続エラー",
	},
	forbidden: {
		description: "この部屋に入室する権限がありません。",
		heading: "アクセスが拒否されました",
	},
	notFound: {
		description: "この部屋は削除されたか、存在しません。",
		heading: "部屋が見つかりません",
	},
	unauthorized: {
		description: "この部屋に入室するにはログインが必要です。",
		heading: "認証が必要です",
	},
};

export function MatchingError({ errorType }: { errorType: MatchingErrorType }) {
	const config = ERROR_CONFIG[errorType];

	return (
		<InPageError
			description={config.description}
			heading={config.heading}
			replaceNavigation
		/>
	);
}
