import { DurableObject } from "cloudflare:workers";
import {
	type MatchingClientMessage,
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
import { safeParse } from "valibot";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { RoomService } from "../room/RoomService";
import { ConnectionService } from "../websocket/ConnectionService";
import { WebSocketService } from "../websocket/WebsocketService";

/** ハートビート間隔（ミリ秒） */
const HEARTBEAT_INTERVAL_MS = 5_000 as const;
/** PONG応答のタイムアウト（ミリ秒）。この期間内に戻って来られれば再開可能 */
const HEARTBEAT_TIMEOUT_MS = 10_000 as const;

export class MatchingDurableObject extends DurableObject<Env> {
	private readonly connectionService = new ConnectionService();
	private readonly db: DrizzleClient;
	private readonly roomService: RoomService;
	private readonly webSocketService = new WebSocketService();
	private gameId: GameId | null = null;

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

		const existingConnection = this.connectionService.get(player.id);
		if (existingConnection) {
			existingConnection.close(4001, "新しい接続に置き換えられました。");
		}

		// Durable Object の context で WebSocket を accept する
		this.ctx.acceptWebSocket(server);

		// 接続を登録（ハートビート管理も含む）
		this.connectionService.register({ id: player.id, socket: server });

		// ハートビートアラームを開始（既に設定されていなければ）
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
		}

		await this.broadcastParticipants({ gameId });

		return this.webSocketService.upgradeResponse({ client });
	}

	/**
	 * WS 切断時に接続を切断状態にする。
	 * ハートビート情報は保持し、再接続の猶予を与える
	 */
	async webSocketClose(ws: WebSocket): Promise<void> {
		this.connectionService.disconnect(ws);
	}

	/**
	 * WS メッセージ受信時の処理
	 */
	async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
		if (!this.gameId) return;

		const playerId = this.connectionService.findIdBySocket(ws);

		if (!playerId) {
			ws.close(4409, "接続が見つかりません");
			return;
		}

		const parsedMessage = this.parseClientMessage({ message, ws });
		if (!parsedMessage) return;

		switch (parsedMessage.type) {
			case "EXIT":
				await this.handleExit({ playerId, ws });
				break;
			case "PONG":
				this.connectionService.recordPong(playerId);
				break;
		}
	}

	/**
	 * Durable Object アラームハンドラ
	 * 定期的にPINGを送信し、切断されたプレイヤーをクリーンアップする
	 */
	async alarm(): Promise<void> {
		if (!this.gameId) return;

		// 全接続にPINGを送信
		this.connectionService.sendPingToAll();

		// DBから現在のプレイヤー一覧を取得
		const players = await this.fetchParticipants({ gameId: this.gameId });

		// 接続がなく、タイムアウトしたプレイヤーを格納
		const disconnectedPlayerIds: PlayerId[] = [];

		for (const player of players) {
			const isTimedOut = this.connectionService.isTimedOut({
				id: player.id,
				timeoutMs: HEARTBEAT_TIMEOUT_MS,
			});

			if (isTimedOut) {
				// タイムアウトしていたら、接続解除
				const ws = this.connectionService.get(player.id);
				if (ws) {
					try {
						ws.close(4408, "ハートビートタイムアウト");
					} catch {
						// noop
						console.log("websocketのcloseに失敗しました。");
					}
				}

				this.connectionService.unregister(player.id);
				disconnectedPlayerIds.push(player.id);
			}
		}

		// タイムアウトしたプレイヤーを削除
		for (const playerId of disconnectedPlayerIds) {
			await this.db.delete(playerTable).where(eq(playerTable.id, playerId));
		}

		// 残りのプレイヤーを確認
		const remainingParticipants = await this.fetchParticipants({
			gameId: this.gameId,
		});

		if (remainingParticipants.length === 0) {
			await this.deleteRoom({ gameId: this.gameId });
			return;
		}

		// プレイヤーが削除された場合、参加者一覧を更新
		if (disconnectedPlayerIds.length > 0) {
			await this.broadcastParticipants({ gameId: this.gameId });
		}

		// 接続が残っている場合は次のアラームを設定
		if (this.connectionService.size > 0 || remainingParticipants.length > 0) {
			await this.ctx.storage.setAlarm(Date.now() + HEARTBEAT_INTERVAL_MS);
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

		this.connectionService.unregister(playerId);

		await this.db.delete(playerTable).where(eq(playerTable.id, playerId));

		ws.close(4204, "退出しました");

		const participants = await this.fetchParticipants({ gameId: this.gameId });

		if (participants.length === 0) {
			await this.deleteRoom({ gameId: this.gameId });
			return;
		}

		await this.broadcastParticipants({ gameId: this.gameId });
	}

	/**
	 * 部屋を削除し、全接続をクローズする
	 */
	private async deleteRoom({ gameId }: { gameId: GameId }): Promise<void> {
		await this.db.delete(gameTable).where(eq(gameTable.id, gameId));
		for (const socket of this.connectionService.getSockets()) {
			socket.close(4410, "部屋が削除されました");
		}
		this.connectionService.clear();
	}

	/**
	 * クライアントメッセージをパースして検証する
	 */
	private parseClientMessage({
		ws,
		message,
	}: {
		ws: WebSocket;
		message: string;
	}): MatchingClientMessage | null {
		try {
			const json = JSON.parse(message);
			const result = safeParse(matchingClientMessageSchema, json);

			if (!result.success) {
				ws.close(4400, "メッセージの形式が正しくありません");
				return null;
			}

			return result.output;
		} catch {
			ws.close(4400, "メッセージのパースに失敗しました");
			return null;
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
	}): Promise<Pick<Player, "id">> {
		const tokenHash = this.roomService.hashGameToken(token);
		const [player] = await this.db
			.select({
				id: playerTable.id,
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
	private async fetchParticipants({
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
	private async broadcastParticipants({ gameId }: { gameId: GameId }) {
		const participants = await this.fetchParticipants({ gameId });

		if (participants.length === 0) return;

		this.webSocketService.broadcastJson({
			payload: {
				participants,
				type: "PARTICIPANTS",
			} satisfies MatchingServerParticipantsMessage,
			sockets: this.connectionService.getSockets(),
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
}
