import type { HeartbeatPingMessage } from "@repo/db/model";
import { isPlayerId, type PlayerId } from "@repo/db/schema";
import type { BaseIssue, BaseSchema, InferOutput } from "valibot";
import { safeParse } from "valibot";

/**
 * WebSocket の機能を共通化したユーティリティ。
 */
export class WebSocketService {
	/**
	 * プレイヤーIDと直近で受理した接続のシーケンス番号のマップ
	 */
	private readonly lastConnectSeq = new Map<PlayerId, number>();

	/**
	 * 接続試行がこのプレイヤーにとって最新かどうか判定し、最新なら記録する。
	 * 接続処理に非同期処理を挟むため、到達順は生成順と一致しない。
	 * 古いリクエストの場合は接続要求を拒否する。
	 * @param connectSeq クライアントでリクエストごとにインクリメントした値。大きい方が最新のリクエストとなる
	 * @returns 最新の接続試行であれば true、古い場合は false
	 */
	acceptIfLatestConnect({
		playerId,
		connectSeq,
	}: {
		playerId: PlayerId;
		connectSeq: number;
	}): boolean {
		const lastConnectSeq = this.lastConnectSeq.get(playerId) ?? -1;
		if (connectSeq <= lastConnectSeq) return false;
		this.lastConnectSeq.set(playerId, connectSeq);
		return true;
	}

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
			if (socket.readyState !== WebSocket.OPEN) continue;
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

	/**
	 * プレイヤーIDからアクティブなWebSocketを取得する。
	 * readyState === OPEN の接続のみ返す。
	 */
	getPlayerSocket({
		ctx,
		playerId,
	}: {
		ctx: DurableObjectState;
		playerId: PlayerId;
	}): WebSocket | null {
		const sockets = ctx.getWebSockets(playerId);
		return (
			sockets.find((socket) => socket.readyState === WebSocket.OPEN) ?? null
		);
	}

	/**
	 * WebSocketからプレイヤーIDを特定する。
	 * acceptWebSocket時に設定したタグを使用して特定する。
	 */
	getPlayerIdBySocket({
		ctx,
		ws,
	}: {
		ctx: DurableObjectState;
		ws: WebSocket;
	}): PlayerId | null {
		const playerId = ctx.getTags(ws)[0];
		if (!isPlayerId(playerId)) return null;
		return playerId;
	}

	/**
	 * 全てのアクティブな接続にPINGを送信する。
	 */
	sendPingToAll({ ctx }: { ctx: DurableObjectState }): void {
		for (const socket of ctx.getWebSockets()) {
			if (socket.readyState !== WebSocket.OPEN) continue;
			try {
				socket.send(
					JSON.stringify({
						type: "PING",
					} satisfies HeartbeatPingMessage),
				);
			} catch (error) {
				console.error("PINGの送信に失敗しました:", error);
			}
		}
	}
}
