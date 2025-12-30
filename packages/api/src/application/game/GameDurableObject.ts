import { DurableObject } from "cloudflare:workers";
import type { GameState } from "@repo/db/model";
import {
	type GameId,
	isGameId,
	type Player,
	type PlayerId,
	playerTable,
	type RoundNo,
} from "@repo/db/schema";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { RoomService } from "../room/RoomService";
import { WebSocketService } from "../websocket/WebsocketService";

export class GameDurableObject extends DurableObject<Env> {
	private readonly db: DrizzleClient;
	private readonly webSocketService = new WebSocketService();
	private gameId: GameId | null = null;
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: 実装途中
	private round: RoundNo = 1;
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: 実装途中
	private state: GameState = "waiting";
	private readonly connections = new Map<
		PlayerId,
		{
			cards: string[];
			socket: WebSocket | null;
		}
	>();
	private readonly roomService: RoomService;

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

		const existingConnections = this.connections.get(player.id);
		if (existingConnections?.socket) {
			existingConnections.socket.close(
				4001,
				"新しい接続に置き換えられました。",
			);
		}

		// Durable Object の context で WebSocket を accept する
		this.ctx.acceptWebSocket(server);

		// 接続を登録
		this.connections.set(player.id, { cards: [], socket: server });

		// 接続数が4人になったらゲーム開始
		if (this.connections.size === 4) {
			this.state = "setting";
			await this.ctx.storage.deleteAlarm();
			// TODO: ゲーム開始までの初期設定処理
		}

		// 接続待ちのカウント開始
		// 先に入ったプレイヤーが既にalermをセットしている可能性があるため確認
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + 20000);
		}
		return this.webSocketService.upgradeResponse({ client });
	}

	/**
	 * WS エラー発生時に接続を切断状態にし、ログを出力する。
	 */
	async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
		ws.close(1011, "サーバーエラーが発生しました");
		console.error("WebSocketでエラーが発生しました:", error);
	}

	async alarm(): Promise<void> {
		if (!this.gameId) return;
		// 接続待機タイムアウトになったらゲームを開始
		this.state = "setting";
		await this.ctx.storage.deleteAlarm();
		// TODO: ゲーム開始までの初期設定処理
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
