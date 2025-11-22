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
import { RoomService } from "../../application/room/RoomService";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { WebSocketService } from "../../libs/WebsocketService";

export class MatchingDurableObject extends DurableObject<Env> {
	private readonly connections = new Map<PlayerId, WebSocket>();
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

		const existingConnection = this.connections.get(player.id);
		if (existingConnection) {
			existingConnection.close(4001, "新しい接続に置き換えられました。");
		}

		// Durable Object の context で WebSocket を accept する
		this.ctx.acceptWebSocket(server);

		this.connections.set(player.id, server);
		await this.broadcastParticipants({ gameId });

		return this.webSocketService.upgradeResponse({ client });
	}

	/**
	 * WS 切断時に接続情報を破棄し、残りの参加者に最新状態を通知する。
	 */
	async webSocketClose(ws: WebSocket): Promise<void> {
		let removedPlayerId: PlayerId | null = null;

		for (const [playerId, connectingWs] of this.connections.entries()) {
			if (connectingWs === ws) {
				this.connections.delete(playerId);
				removedPlayerId = playerId;
				break;
			}
		}

		if (!this.gameId) return;

		if (removedPlayerId) {
			await this.db
				.delete(playerTable)
				.where(eq(playerTable.id, removedPlayerId));
		}

		const participants = await this.fetchParticipants({ gameId: this.gameId });

		if (participants.length === 0) {
			await this.deleteRoom({ gameId: this.gameId });
			return;
		}

		await this.broadcastParticipants({ gameId: this.gameId });
	}

	/**
	 * WS メッセージ受信時の処理
	 */
	async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
		if (!this.gameId) return;

		let playerId: PlayerId | null = null;
		for (const [id, connectingWs] of this.connections.entries()) {
			if (connectingWs === ws) {
				playerId = id;
				break;
			}
		}

		if (!playerId) {
			ws.close(4409, "接続が見つかりません");
			return;
		}

		const parsedMessage = this.parseClientMessage({ message, ws });
		if (!parsedMessage) return;

		switch (parsedMessage.type) {
			case "LEAVE":
				await this.handleLeave({ playerId, ws });
				break;
		}
	}

	/**
	 * プレイヤーの退出処理を行う
	 */
	private async handleLeave({
		playerId,
		ws,
	}: {
		playerId: PlayerId;
		ws: WebSocket;
	}): Promise<void> {
		if (!this.gameId) return;

		this.connections.delete(playerId);

		await this.db.delete(playerTable).where(eq(playerTable.id, playerId));

		ws.close(1000, "退出しました");

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
		for (const connectingWs of this.connections.values()) {
			connectingWs.close(1000, "部屋が削除されました");
		}
		this.connections.clear();
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
			throw new HTTPException(401, {
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
			sockets: this.connections.values(),
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
