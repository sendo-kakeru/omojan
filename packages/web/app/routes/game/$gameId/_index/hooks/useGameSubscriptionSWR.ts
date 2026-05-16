import {
	type GameClientReactionMessage,
	type GameClientSubmissionMessage,
	type GameClientVoteMessage,
	type GameServerMessage,
	type GameServerReactionMessage,
	gameServerMessageSchema,
	type ReactionEmoji,
} from "@repo/db/model";
import type { GameId, PlayerId } from "@repo/db/schema";
import pRetry from "p-retry";
import { useRef } from "react";
import { useNavigate } from "react-router";
import useSWRSubscription, {
	type SWRSubscriptionOptions,
} from "swr/subscription";
import { parse } from "valibot";

function getUrl({ gameId }: { gameId: GameId }): URL | undefined {
	try {
		return new URL(`/v1/games/${gameId}`, import.meta.env.VITE_API_URL);
	} catch (error) {
		console.error("URLの形式が正しくありません。", error);
		return;
	}
}

export function useGameSubscriptionSWR({
	gameId,
	gameToken,
	onReaction,
}: {
	gameId: GameId;
	gameToken: string | null;
	onReaction: (reaction: GameServerReactionMessage) => void;
}) {
	const wsRef = useRef<WebSocket | null>(null);
	const navigate = useNavigate();
	const url = getUrl({ gameId });

	const subscription = useSWRSubscription<GameServerMessage, unknown>(
		[url?.toString(), gameToken],
		(
			_: string,
			{ next }: SWRSubscriptionOptions<GameServerMessage, unknown>,
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

			const handleMessage = (event: MessageEvent): void => {
				try {
					const message = parse(
						gameServerMessageSchema,
						JSON.parse(event.data),
					);

					// リアクションはゲーム状態と分離して処理
					if (message.type === "REACTION") {
						onReaction(message);
						return;
					}

					next(null, message);
				} catch (error) {
					console.error("メッセージの形式が正しくありません:", error, event);
					next(
						error instanceof Error
							? error
							: new Error("メッセージの形式が正しくありません。"),
					);
					ws.close(1011, "メッセージの解析に失敗しました。");
				}
			};

			const handleError = (event: Event): void => {
				console.error("接続に失敗しました。", event);
				next(new Error("接続に失敗しました。"));
				ws.close(1011, "接続エラーが発生しました。");
			};

			const handleClose = (event: CloseEvent): void => {
				if (
					event.code !== 1000 &&
					event.code !== 4001 &&
					event.code !== 4204 &&
					event.code !== 4410
				) {
					console.error("接続が閉じられました。", event);
					next(
						new Error("接続が切断されました。時間をおいて再接続してください。"),
					);
				}
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

	const sendSubmission = async ({
		text,
		position,
	}: GameClientSubmissionMessage["submission"]): Promise<void> => {
		try {
			await pRetry(
				() => {
					if (!wsRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
						throw new Error("WebSocketが接続されていません。");
					}
					wsRef.current.send(
						JSON.stringify({
							submission: { position, text },
							type: "SUBMIT",
						} satisfies GameClientSubmissionMessage),
					);
				},
				{
					retries: 3,
				},
			);
		} catch (error) {
			console.error("提出の送信に失敗しました。", error);
			alert("提出に失敗しました。ゲームを終了します。");
			wsRef.current?.close(4410, "提出の送信に失敗しました。");
			void navigate("/", { replace: true });
		}
	};

	const sendVote = async (votePlayerId: PlayerId): Promise<void> => {
		try {
			await pRetry(
				() => {
					if (!wsRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
						throw new Error("WebSocketが接続されていません。");
					}
					wsRef.current.send(
						JSON.stringify({
							type: "VOTE",
							votePlayerId,
						} satisfies GameClientVoteMessage),
					);
				},
				{
					retries: 3,
				},
			);
		} catch (error) {
			console.error("投票の送信に失敗しました。", error);
			alert("投票に失敗しました。ゲームを終了します。");
			wsRef.current?.close(4410, "投票の送信に失敗しました。");
			void navigate("/", { replace: true });
		}
	};

	const sendReaction = async (emoji: ReactionEmoji): Promise<void> => {
		try {
			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				return;
			}
			wsRef.current.send(
				JSON.stringify({
					emoji,
					type: "REACTION",
				} satisfies GameClientReactionMessage),
			);
		} catch (error) {
			// リアクションはゲーム進行に影響しないため、エラーは無視
			console.error("リアクションの送信に失敗しました。", error);
		}
	};

	return {
		...subscription,
		sendReaction,
		sendSubmission,
		sendVote,
		wsRef,
	};
}
