import {
	type HeartbeatPongMessage,
	type MatchingClientMessage,
	type MatchingParticipant,
	matchingServerMessageSchema,
} from "@repo/db/model";
import { useRef, useState } from "react";
import useSWRSubscription, {
	type SWRSubscriptionOptions,
} from "swr/subscription";
import { parse } from "valibot";

function getUrl({ gameId }: { gameId: string }): URL | undefined {
	try {
		return new URL(`/v1/matchings/${gameId}`, import.meta.env.VITE_API_URL);
	} catch (error) {
		console.error("URLの形式が正しくありません。", error);
		return;
	}
}

export function useMatchingSubscriptionSWR({
	gameId,
	gameToken,
	onClose,
	onCompleted,
}: {
	gameId: string;
	gameToken: string | null;
	onClose: (event: CloseEvent) => void;
	onCompleted: () => void;
}) {
	const wsRef = useRef<WebSocket | null>(null);
	const matchingCompletedTimeoutRef = useRef<number | null>(null);
	const [isHost, setIsHost] = useState(false);

	const url = getUrl({ gameId });
	// なくても問題なく動いているのでコメントアウト
	// url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

	const subscription = useSWRSubscription<MatchingParticipant[], unknown>(
		[url?.toString(), gameToken],
		(
			_: string,
			{ next }: SWRSubscriptionOptions<MatchingParticipant[], unknown>,
		) => {
			if (!url) {
				next(new Error("Invalid URL"));
				return () => {};
			}

			if (!gameToken) {
				next(new Error("ゲームトークンがありません。再度入室してください。"));
				return () => {};
			}

			url.searchParams.set("token", gameToken);

			const ws = new WebSocket(url.toString());
			wsRef.current = ws;

			const handleMessage = (event: MessageEvent) => {
				try {
					const payload = JSON.parse(event.data);
					const message = parse(matchingServerMessageSchema, payload);

					switch (message.type) {
						case "PING": {
							ws.send(
								JSON.stringify({ type: "PONG" } satisfies HeartbeatPongMessage),
							);
							break;
						}
						case "PARTICIPANTS": {
							if (message.participants.length === 4) {
								matchingCompletedTimeoutRef.current = window.setTimeout(() => {
									onCompleted();
									ws.close(1000, "マッチングが完了しました。");
								}, 5000);
							} else {
								if (matchingCompletedTimeoutRef.current) {
									clearTimeout(matchingCompletedTimeoutRef.current);
									matchingCompletedTimeoutRef.current = null;
								}
							}
							next(null, message.participants);
							break;
						}
						case "ME_PLAYER": {
							const { player } = message;
							setIsHost(player.isHost);
							break;
						}
					}
				} catch (error) {
					console.error("メッセージの形式が正しくありません:", error, event);
					next(
						error instanceof Error
							? error
							: new Error("メッセージの形式が正しくありません。"),
					);
					ws.close(4500, "メッセージの解析に失敗しました。");
				}
			};

			const handleError = (event: Event) => {
				console.error("接続に失敗しました。", event);
				next(new Error("接続に失敗しました。"));
				ws.close(4500, "接続エラーが発生しました。");
			};

			const handleClose = (event: CloseEvent) => {
				if (event.code !== 1000 && event.code !== 4204 && event.code !== 4410) {
					console.error("接続が閉じられました。", event);
					next(
						new Error("接続が切断されました。時間をおいて再接続してください。"),
					);
				}
				if (matchingCompletedTimeoutRef.current) {
					clearTimeout(matchingCompletedTimeoutRef.current);
					matchingCompletedTimeoutRef.current = null;
				}
				onClose(event);
			};

			ws.addEventListener("message", handleMessage);
			ws.addEventListener("error", handleError);
			ws.addEventListener("close", handleClose);

			return () => {
				ws.removeEventListener("message", handleMessage);
				ws.removeEventListener("error", handleError);
				ws.removeEventListener("close", handleClose);
				ws.close(4204, "接続を終了します。");
				if (wsRef.current === ws) {
					wsRef.current = null;
				}
			};
		},
		{
			revalidateIfStale: false,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			shouldRetryOnError: false,
		},
	);

	const sendExit = (): void => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			throw new Error("WebSocketが接続されていません。");
		}

		ws.send(JSON.stringify({ type: "EXIT" } satisfies MatchingClientMessage));
	};

	const sendStart = (): void => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) {
			throw new Error("WebSocketが接続されていません。");
		}

		ws.send(JSON.stringify({ type: "START" } satisfies MatchingClientMessage));
	};

	return {
		...subscription,
		isHost,
		matchingCompletedTimeoutRef,
		sendExit,
		sendStart,
		wsRef,
	};
}
