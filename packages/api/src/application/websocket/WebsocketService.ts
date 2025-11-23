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
}
