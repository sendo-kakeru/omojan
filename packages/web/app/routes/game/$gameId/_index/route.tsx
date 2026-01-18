import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Spinner } from "~/components/Spinner";
import { useNavigationWarning } from "~/hooks/useNavigationWarning";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import type { Route } from "./+types/route";
import { GamePresenter } from "./components/GamePresenter";
import { useGameSubscriptionSWR } from "./hooks/useGameSubscriptionSWR";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	const navigate = useNavigate();
	const gameToken = gameTokenLocalStorage.get({
		onError() {
			alert(LOCALSTORAGE_OPERATION_FAILED_MESSAGE);
			void navigate("/");
		},
	});

	const { data, error, sendSubmission, sendVote, wsRef } =
		useGameSubscriptionSWR({
			gameId,
			gameToken,
			onClose: (_event: CloseEvent) => {
				// 不要だったら消す
			},
		});

	// ゲーム中はナビゲーション警告を表示（ENDメッセージを受信するまで）
	const isConnected = wsRef.current?.readyState === WebSocket.OPEN;
	const isGameEnded = data?.type === "END";
	useNavigationWarning({
		enabled: isConnected && !isGameEnded,
		message: "ゲームを中断しますか？",
	});

	if (!WebSocket || wsRef.current?.readyState !== WebSocket.OPEN || !data) {
		return (
			<main className="grid place-items-center gap-y-4 py-24 text-neutral-500">
				<Spinner className="size-32" />
				<p className="text-center">ゲームを開始しています…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className="grid place-items-center gap-y-12">
				<h2 className="font-bold text-xl">エラーが発生しました。</h2>
				<Button as="link" className="w-fit" to="/">
					トップに戻る
				</Button>
			</main>
		);
	}

	return (
		<GamePresenter
			data={data}
			sendSubmission={sendSubmission}
			sendVote={sendVote}
		/>
	);
}
