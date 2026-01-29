import { DurableObject } from "cloudflare:workers";
import {
	type MatchingServerMePlayerMessage,
	type MatchingServerParticipantsMessage,
	matchingClientMessageSchema,
} from "@repo/db/model";
import {
	type GameId,
	gameTable,
	isGameId,
	type Player,
	type PlayerId,
	playerTable,
	type User,
	userTable,
} from "@repo/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { RoomService } from "../room/RoomService";
import { WebSocketService } from "../websocket/WebsocketService";

/** ハートビート間隔（ミリ秒） */
const HEARTBEAT_INTERVAL_MS = 5_000 as const;
/** PONG応答のタイムアウト（ミリ秒）。この期間内に戻って来られれば再開可能 */
const HEARTBEAT_TIMEOUT_MS = 10_000 as const;

export class MatchingDurableObject extends DurableObject<Env> {
	private readonly db: DrizzleClient;
	private readonly roomService: RoomService;
	private readonly webSocketService = new WebSocketService();
	private gameId: GameId | null = null;
	/** プレイヤーIDと最終PONG受信時刻のマップ */
	private readonly lastPongAt = new Map<PlayerId, number>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.db = createDrizzleClient(env);
		this.roomService = new RoomService(this.db);
	}

	/**
	 * HTTP/WS のリクエストを受け取り、WebSocket のみを受け付ける。
	 */
	async fetch(request: Request): Promise<Response> {
		const { token, gameId } = this.getSearchParams(request);
		this.ensureGameId(gameId);

		// ゲームステータスをチェック
		const gameStatus = await this.getGameStatus({ gameId });

		// 終了済みのゲームは接続を拒否
		if (gameStatus === "finished") {
			throw new HTTPException(410, {
				message: "この部屋は終了しています",
			});
		}

		if (!this.webSocketService.isUpgradeRequest(request)) {
			throw new HTTPException(426, {
				message: "Upgrade: websocket を指定してください",
			});
		}

		// WS リクエストをアップグレードし、参加者一覧を即時配信する。
		const player = await this.verifyPlayer({ gameId, token });
		const [client, server] = Object.values(new WebSocketPair());

		if (!client || !server) {
			throw new HTTPException(500, {
				message: "WebSocket Pairの作成に失敗しました。",
			});
		}

		// 既存の接続を閉じる（同じプレイヤーの再接続の場合）
		const existingSocket = this.webSocketService.getPlayerSocket({
			ctx: this.ctx,
			playerId: player.id,
		});
		if (existingSocket) {
			existingSocket.close(4001, "新しい接続に置き換えられました。");
		}

		// Durable Object の context で WebSocket を accept する
		this.ctx.acceptWebSocket(server, [player.id]);

		// ゲームが既にactive状態の場合は、接続後すぐに閉じてゲーム画面へリダイレクトを促す
		if (gameStatus === "active") {
			server.close(1000, "ゲームが開始されました");
			return this.webSocketService.upgradeResponse({ client });
		}

		// ハートビート管理用に最終PONG時刻を記録
		this.lastPongAt.set(player.id, Date.now());

		// 自身のプレイヤー情報を先に送信
		await this.sendMePlayerMessage({ player, socket: server });

		// ハートビートアラームを開始（既に設定されていなければ）
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
		}
		const participants = await this.getParticipants({ gameId });
		await this.broadcastParticipants({ participants });

		return this.webSocketService.upgradeResponse({ client });
	}

	/**
	 * WS エラー発生時に接続を切断状態にし、ログを出力する。
	 */
	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		ws.close(1011, "サーバーエラーが発生しました");
		console.error("WebSocketでエラーが発生しました:", error);
	}

	/**
	 * WS 接続クローズ時の処理
	 * ブラウザバック、タブ閉じ、ネットワーク切断などで呼ばれる
	 */
	async webSocketClose(ws: WebSocket): Promise<void> {
		if (!this.gameId) return;

		const playerId = this.webSocketService.getPlayerIdBySocket({
			ctx: this.ctx,
			ws,
		});

		if (!playerId) return;

		// lastPongAtを現在時刻に設定し、タイムアウト猶予を与える
		// これにより、一時的な切断からの復帰が可能
		// 完全な削除はalarm()のタイムアウト処理に委ねる
		const now = Date.now();

		// 既に記録がある場合は更新しない（意図的な切断の可能性）
		if (!this.lastPongAt.get(playerId)) {
			this.lastPongAt.set(playerId, now);
		}

		// アラームが設定されていない場合は設定（クリーンアップ用）
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(now + HEARTBEAT_INTERVAL_MS);
		}
	}

	/**
	 * WS メッセージ受信時の処理
	 */
	async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
		if (!this.gameId) return;

		const playerId = this.webSocketService.getPlayerIdBySocket({
			ctx: this.ctx,
			ws,
		});

		if (!playerId) {
			ws.close(1007, "接続が見つかりません");
			return;
		}

		const parsedMessage = this.webSocketService.parseClientMessage({
			message,
			schema: matchingClientMessageSchema,
			ws,
		});
		if (!parsedMessage) return;

		switch (parsedMessage.type) {
			case "EXIT":
				await this.handleExit({ playerId, ws });
				break;
			case "PONG":
				this.lastPongAt.set(playerId, Date.now());
				break;
			case "START":
				await this.handleStart({ playerId, ws });
				break;
		}
	}

	/**
	 * Durable Object アラームハンドラ
	 * 定期的にPINGを送信し、切断されたプレイヤーをクリーンアップする
	 */
	async alarm(): Promise<void> {
		if (!this.gameId) {
			// gameIdがない場合、残っている接続を全て閉じる
			await this.closeAllConnections({ message: "部屋が見つかりません" });
			return;
		}

		const gameStatus = await this.roomService.getStatus(this.gameId);

		// ゲームが存在しない場合、全接続を閉じてクリーンアップ
		if (!gameStatus) {
			await this.closeAllConnections({ message: "部屋が削除されました" });
			this.cleanup();
			return;
		}

		// ゲームが開始済み or 終了済みの場合、全接続を閉じてクリーンアップ
		if (gameStatus !== "waiting") {
			const isActive = gameStatus === "active";
			await this.closeAllConnections({
				code: isActive ? 1000 : 1007,
				message: isActive
					? "ゲームが開始されました"
					: "この部屋は終了しています",
			});
			this.cleanup();
			return;
		}

		// 全接続にPINGを送信
		this.webSocketService.sendPingToAll({ ctx: this.ctx });

		// DBから現在のプレイヤー一覧を取得
		const players = await this.getParticipants({ gameId: this.gameId });

		// 接続がなく、タイムアウトしたプレイヤーを格納
		const disconnectedPlayerIds: PlayerId[] = [];
		const now = Date.now();

		for (const player of players) {
			// アクティブな接続があるプレイヤーはスキップ
			const ws = this.webSocketService.getPlayerSocket({
				ctx: this.ctx,
				playerId: player.id,
			});
			if (ws) {
				// 接続があるがlastPongAtがない場合（Durable Object再起動後など）は記録を初期化
				if (!this.lastPongAt.has(player.id)) {
					this.lastPongAt.set(player.id, now);
				}
				continue;
			}

			// 接続がないプレイヤーはタイムアウト判定
			const lastPong = this.lastPongAt.get(player.id);
			const isTimedOut = !lastPong || now - lastPong > HEARTBEAT_TIMEOUT_MS;

			if (isTimedOut) {
				this.lastPongAt.delete(player.id);
				disconnectedPlayerIds.push(player.id);
			}
		}

		// タイムアウトしたプレイヤーを削除
		for (const playerId of disconnectedPlayerIds) {
			await this.db.delete(playerTable).where(eq(playerTable.id, playerId));
		}

		// 残りのプレイヤーを確認
		const remainingParticipants = await this.getParticipants({
			gameId: this.gameId,
		});

		if (remainingParticipants.length === 0) {
			await this.deleteRoom({ gameId: this.gameId });
			this.cleanup();
			return;
		}

		// プレイヤーが削除された場合、参加者一覧を更新
		if (disconnectedPlayerIds.length > 0) {
			await this.broadcastParticipants({ participants: remainingParticipants });
		}

		// 次のアラームを設定（プレイヤーがいる限り継続）
		await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
	}

	/**
	 * 全ての接続をクローズする
	 */
	private async closeAllConnections({
		code = 4410,
		message,
	}: {
		code?: number;
		message: string;
	}): Promise<void> {
		for (const socket of this.ctx.getWebSockets()) {
			socket.close(code, message);
		}
	}

	/**
	 * DurableObjectの状態をクリーンアップする
	 */
	private cleanup(): void {
		this.lastPongAt.clear();
	}

	/**
	 * 不足分をCPで埋めてゲームを開始する
	 */
	private async handleStart({
		playerId,
		ws,
	}: {
		playerId: PlayerId;
		ws: WebSocket;
	}): Promise<void> {
		if (!this.gameId) return;

		const [player] = await this.db
			.select({ isHost: playerTable.isHost })
			.from(playerTable)
			.where(eq(playerTable.id, playerId));

		if (!player?.isHost) {
			ws.close(4403, "ホストのみが開始を実行できます");
			return;
		}

		const gameStatus = await this.roomService.getStatus(this.gameId);
		if (gameStatus !== "waiting") return;

		try {
			await this.roomService.startWithCpu({ gameId: this.gameId });
		} catch (error) {
			console.error("CPUを追加したゲームの開始に失敗しました:", error);
			ws.close(1011, "ゲームの開始に失敗しました");
			return;
		}

		const participants = await this.getParticipants({ gameId: this.gameId });
		await this.broadcastParticipants({ participants });
	}

	/**
	 * クライアント自身のプレイヤー情報を送信する
	 */
	private async sendMePlayerMessage({
		player,
		socket,
	}: {
		player: MatchingServerMePlayerMessage["player"];
		socket: WebSocket;
	}): Promise<void> {
		try {
			socket.send(
				JSON.stringify({
					player,
					type: "ME_PLAYER",
				} satisfies MatchingServerMePlayerMessage),
			);
		} catch (error) {
			console.error("ME_PLAYERメッセージの送信に失敗しました:", error);
		}
	}

	/**
	 * プレイヤーの退出処理を行う
	 */
	private async handleExit({
		playerId,
		ws,
	}: {
		playerId: PlayerId;
		ws: WebSocket;
	}): Promise<void> {
		if (!this.gameId) return;

		const gameStatus = await this.roomService.getStatus(this.gameId);

		// NOTE: 既に4人メンバーが確定し、activeになっていたら接続だけ解除。（確定からゲーム移動までの時間は退出操作不可なので、通常は発生し得ない）
		if (gameStatus === "waiting") {
			await this.db.delete(playerTable).where(eq(playerTable.id, playerId));
		}

		ws.close(4204, "退出しました");

		const participants = await this.getParticipants({ gameId: this.gameId });

		if (participants.length === 0) {
			await this.deleteRoom({ gameId: this.gameId });
			return;
		}

		await this.broadcastParticipants({ participants });
	}

	/**
	 * 部屋を削除し、全接続をクローズする
	 */
	private async deleteRoom({ gameId }: { gameId: GameId }): Promise<void> {
		await this.db.delete(gameTable).where(eq(gameTable.id, gameId));
		for (const socket of this.ctx.getWebSockets()) {
			socket.close(4410, "部屋が削除されました");
		}
	}

	/**
	 * 入室トークンが該当ゲームのプレイヤーに属しているか検証する。
	 */
	private async verifyPlayer({
		gameId,
		token,
	}: {
		gameId: GameId;
		token: string;
	}): Promise<MatchingServerMePlayerMessage["player"]> {
		const tokenHash = this.roomService.hashGameToken(token);
		const [player] = await this.db
			.select({
				id: playerTable.id,
				isHost: playerTable.isHost,
			})
			.from(playerTable)
			.where(
				and(
					eq(playerTable.gameId, gameId),
					eq(playerTable.gameTokenHash, tokenHash),
				),
			);

		if (!player) {
			throw new HTTPException(403, {
				message: "入室トークンが正しくありません",
			});
		}

		return player;
	}

	/**
	 * ゲームに属する全プレイヤーを seat 順に取得する。
	 */
	private async getParticipants({
		gameId,
	}: {
		gameId: GameId;
	}): Promise<(Pick<Player, "id" | "playerName"> & Pick<User, "image">)[]> {
		const players = await this.db
			.select({
				id: playerTable.id,
				image: userTable.image,
				playerName: playerTable.playerName,
			})
			.from(playerTable)
			.leftJoin(userTable, eq(playerTable.userId, userTable.id))
			.where(eq(playerTable.gameId, gameId))
			.orderBy(asc(playerTable.seat));

		return players;
	}

	/**
	 * 現在の参加者スナップショットを全接続に JSON で配信する。
	 */
	private async broadcastParticipants({
		participants,
	}: {
		participants: (Pick<Player, "id" | "playerName"> & Pick<User, "image">)[];
	}): Promise<void> {
		if (participants.length === 0) return;

		this.webSocketService.broadcastJson({
			payload: {
				participants,
				type: "PARTICIPANTS",
			} satisfies MatchingServerParticipantsMessage,
			sockets: this.ctx.getWebSockets(),
		});
	}

	/**
	 * 共通クエリ（token / gameId）を抽出し検証する。
	 */
	private getSearchParams(request: Request): { token: string; gameId: GameId } {
		let url: URL;

		try {
			url = new URL(request.url);
		} catch {
			throw new HTTPException(400, { message: "URL が正しくありません" });
		}

		const token = url.searchParams.get("token");
		if (!token) {
			throw new HTTPException(401, { message: "認証情報が不足しています" });
		}

		const gameId = url.searchParams.get("gameId");
		if (!isGameId(gameId)) {
			throw new HTTPException(400, { message: "gameIdが正しくありません" });
		}

		return { gameId, token };
	}

	/**
	 * DurableObject が単一の gameId だけを扱うよう制限する。
	 */
	private ensureGameId(gameId: GameId) {
		if (this.gameId && this.gameId !== gameId) {
			throw new HTTPException(409, {
				message: "DurableObjectが異なるgameIdで呼び出されました。",
			});
		}
		this.gameId = gameId;
	}

	/**
	 * ゲームのステータスを取得する。
	 * 存在しない場合は404エラーを投げる。
	 */
	private async getGameStatus({
		gameId,
	}: {
		gameId: GameId;
	}): Promise<"waiting" | "active" | "finished"> {
		const [game] = await this.db
			.select({ status: gameTable.status })
			.from(gameTable)
			.where(eq(gameTable.id, gameId));

		if (!game) {
			throw new HTTPException(404, {
				message: "指定された部屋が存在しません",
			});
		}

		return game.status;
	}
}
