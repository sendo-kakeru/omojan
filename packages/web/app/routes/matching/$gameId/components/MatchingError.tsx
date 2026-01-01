import { Button } from "~/components/button/Button";

export type MatchingErrorType =
	| "notFound"
	| "forbidden"
	| "unauthorized"
	| "connectionError";

const ERROR_MESSAGES: Record<MatchingErrorType, string> = {
	connectionError: "部屋の接続に失敗しました。",
	forbidden: "入室権限がありません。",
	notFound: "この部屋は削除されています。",
	unauthorized: "入室権限がありません。",
};

export function MatchingError({ errorType }: { errorType: MatchingErrorType }) {
	return (
		<main className="grid place-items-center gap-y-12">
			<h2 className="font-bold text-xl">{ERROR_MESSAGES[errorType]}</h2>
			<Button as="link" className="w-fit" to="/">
				トップに戻る
			</Button>
		</main>
	);
}
