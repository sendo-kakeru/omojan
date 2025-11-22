import type { HeartbeatPingMessage } from "@repo/db/model";

/**
 * WebSocket接続のハートビート管理を行うクラス
 */
export class HeartbeatManager<T> {
	/**
	 * 最後にPONGを受信した時刻
	 */
	private readonly lastPongAt = new Map<T, number>();
	/**
	 * 接続が確認待ちのPONG（初回接続後、最初のPONG受信前）
	 */
	private readonly pendingInitialPong = new Set<T>();

	/**
	 * 新しい接続をハートビート管理に登録する
	 */
	register(id: T): void {
		this.pendingInitialPong.add(id);
		this.lastPongAt.set(id, Date.now());
	}

	/**
	 * 接続をハートビート管理から削除する
	 */
	unregister(id: T): void {
		this.pendingInitialPong.delete(id);
		this.lastPongAt.delete(id);
	}

	/**
	 * PONG受信を記録する
	 */
	recordPong(id: T): void {
		this.pendingInitialPong.delete(id);
		this.lastPongAt.set(id, Date.now());
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
		id: T;
		timeoutMs: number;
		gracePeriodMs: number;
	}): boolean {
		const lastPong = this.lastPongAt.get(id);
		if (!lastPong) return true;

		const now = Date.now();
		const elapsed = now - lastPong;

		// 初回PONG待ちの場合は猶予期間を使用
		if (this.pendingInitialPong.has(id)) {
			return elapsed > gracePeriodMs;
		}

		return elapsed > timeoutMs;
	}

	/**
	 * 全ての接続にPINGを送信する
	 */
	sendPingToAll(sockets: Iterable<WebSocket>): void {
		const payload = JSON.stringify({
			type: "PING",
		} satisfies HeartbeatPingMessage);
		for (const socket of sockets) {
			try {
				socket.send(payload);
			} catch (error) {
				console.error("PINGの送信に失敗しました:", error);
			}
		}
	}
}
