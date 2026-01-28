import { InPageError } from "~/components/InPageError";

export type GameErrorType = "connectionError" | "unknown";

const ERROR_CONFIG: Record<
	GameErrorType,
	{ description: string; heading: string }
> = {
	connectionError: {
		description:
			"ゲームへの接続に失敗しました。時間をおいて再度お試しください。",
		heading: "接続エラー",
	},
	unknown: {
		description:
			"予期しないエラーが発生しました。時間をおいて再度お試しください。",
		heading: "エラーが発生しました",
	},
};

export function GameError({ errorType }: { errorType: GameErrorType }) {
	const config = ERROR_CONFIG[errorType];

	return (
		<InPageError
			description={config.description}
			heading={config.heading}
			replaceNavigation
		/>
	);
}
