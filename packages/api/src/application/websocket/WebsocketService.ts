import type { BaseIssue, BaseSchema, InferOutput } from "valibot";
import { safeParse } from "valibot";

/**
 * WebSocket の機能を共通化したユーティリティ。
 */
export class WebSocketService {
	/**
	 * 受け付け済みソケットを指定して 101 Switching Protocols を返す。
	 */
	upgradeResponse({ client }: { client: WebSocket }): Response {
		return new Response(null, {
			status: 101,
			webSocket: client,
		});
	}

	/**
	 * 複数ソケットに同一の JSON メッセージを一斉送信する。
	 */
	broadcastJson({
		sockets,
		payload,
	}: {
		sockets: Iterable<WebSocket>;
		payload: unknown;
	}): void {
		for (const socket of sockets) {
			try {
				socket.send(JSON.stringify(payload));
			} catch (error) {
				console.error("WebSocket のブロードキャストに失敗しました:", error);
			}
		}
	}

	/**
	 * リクエストが WebSocket アップグレードかどうかを判定する。
	 */
	isUpgradeRequest(request: Request): boolean {
		return request.headers.get("Upgrade") === "websocket";
	}

	/**
	 * クライアントメッセージをパースして検証する。
	 * 失敗時はWebSocketをcloseしてnullを返す。
	 */
	parseClientMessage<
		T extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
	>({
		ws,
		message,
		schema,
	}: {
		ws: WebSocket;
		message: string;
		schema: T;
	}): InferOutput<T> | null {
		try {
			const json = JSON.parse(message);
			const result = safeParse(schema, json);

			if (!result.success) {
				ws.close(1003, "メッセージの形式が正しくありません");
				return null;
			}

			return result.output;
		} catch {
			ws.close(1003, "メッセージのパースに失敗しました");
			return null;
		}
	}
}
