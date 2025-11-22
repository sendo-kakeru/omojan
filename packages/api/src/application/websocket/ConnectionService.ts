import type { HeartbeatPingMessage } from "@repo/db/model";
import type { PlayerId } from "@repo/db/schema";

/**
 * WebSocket接続とハートビートを統合管理するサービス
 */
export class ConnectionService {
	private readonly connections = new Map<
		PlayerId,
		{
			lastPongAt: number;
			pendingInitialPong: boolean;
			socket: WebSocket | null;
		}
	>();

	/**
	 * 新しい接続を登録する
	 */
	register({ id, socket }: { id: PlayerId; socket: WebSocket }): void {
		this.connections.set(id, {
			lastPongAt: Date.now(),
			pendingInitialPong: true,
			socket,
		});
	}

	/**
	 * 接続を完全に削除する（明示的な退出時用）
	 */
	unregister(id: PlayerId): void {
		this.connections.delete(id);
	}

	/**
	 * WebSocketを切断状態にする（切断時用）
	 * ハートビート情報は保持し、再接続の猶予を与える
	 */
	disconnect(socket: WebSocket): PlayerId | null {
		for (const [id, state] of this.connections.entries()) {
			if (state.socket === socket) {
				state.socket = null;
				return id;
			}
		}
		return null;
	}

	/**
	 * IDに対応するWebSocketを取得する
	 */
	get(id: PlayerId): WebSocket | null {
		return this.connections.get(id)?.socket ?? null;
	}

	/**
	 * WebSocketに対応するIDを取得する
	 */
	findIdBySocket(socket: WebSocket): PlayerId | null {
		for (const [id, state] of this.connections.entries()) {
			if (state.socket === socket) {
				return id;
			}
		}
		return null;
	}

	/**
	 * アクティブな接続が存在するかどうかを確認する
	 */
	isConnected(id: PlayerId): boolean {
		return !!this.connections.get(id)?.socket;
	}

	/**
	 * アクティブな接続数を取得する
	 */
	get size(): number {
		let count = 0;
		for (const state of this.connections.values()) {
			if (state.socket !== null) {
				count++;
			}
		}
		return count;
	}

	/**
	 * 全ての接続をクリアする
	 */
	clear(): void {
		this.connections.clear();
	}

	/**
	 * 全てのアクティブなWebSocketを取得する
	 */
	getSockets(): WebSocket[] {
		const sockets: WebSocket[] = [];
		for (const state of this.connections.values()) {
			if (state.socket !== null) {
				sockets.push(state.socket);
			}
		}
		return sockets;
	}

	/**
	 * PONG受信を記録する
	 */
	recordPong(id: PlayerId): void {
		const state = this.connections.get(id);
		if (state) {
			state.pendingInitialPong = false;
			state.lastPongAt = Date.now();
		}
	}

	/**
	 * 接続がタイムアウトしているかどうかを判定する
	 * 初回PONG待ちの接続は猶予期間内であればタイムアウトとしない
	 */
	isTimedOut({
		id,
		timeoutMs,
		gracePeriodMs,
	}: {
		gracePeriodMs: number;
		id: PlayerId;
		timeoutMs: number;
	}): boolean {
		const state = this.connections.get(id);
		if (!state) return true;

		const now = Date.now();
		const elapsed = now - state.lastPongAt;

		// 初回PONG待ちの場合は猶予期間を使用
		if (state.pendingInitialPong) {
			return elapsed > gracePeriodMs;
		}

		return elapsed > timeoutMs;
	}

	/**
	 * 全てのアクティブな接続にPINGを送信する
	 */
	sendPingToAll(): void {
		const payload = JSON.stringify({
			type: "PING",
		} satisfies HeartbeatPingMessage);
		for (const state of this.connections.values()) {
			if (state.socket === null) continue;
			try {
				state.socket.send(payload);
			} catch (error) {
				console.error("PINGの送信に失敗しました:", error);
			}
		}
	}
}
