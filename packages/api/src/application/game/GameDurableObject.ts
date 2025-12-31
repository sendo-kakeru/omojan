import { DurableObject } from "cloudflare:workers";
import type {
	GamePlayerCard,
	GameServerRoundStartMessage,
	GameState,
	gameBaseSchema,
} from "@repo/db/model";
import {
	type GameId,
	isGameId,
	type Player,
	type PlayerId,
	playerTable,
	type RoundNo,
	type RoundTheme,
} from "@repo/db/schema";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { InferOutput } from "valibot";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { RoomService } from "../room/RoomService";
import { WebSocketService } from "../websocket/WebsocketService";
import { GameService } from "./GameService";

export class GameDurableObject extends DurableObject<Env> {
	private readonly db: DrizzleClient;
	private readonly webSocketService = new WebSocketService();
	private readonly gameService: GameService;
	private readonly roomService: RoomService;
	private gameId: GameId | null = null;
	private state: GameState = "waiting";
	private roundNo: RoundNo = 1;
	private themes: Map<RoundNo, RoundTheme["text"]> = new Map();
	private timeLimit = 30;
	// TODO: 型が決まってきたらちゃんと定義
	private players: Omit<
		InferOutput<typeof gameBaseSchema>["game"]["players"][number],
		"submittedText"
	>[] = [];

	private readonly connections = new Map<
		PlayerId,
		{
			cards: GamePlayerCard[];
			isCpu: boolean;
			// 未接続 or CPUはnull
			socket: WebSocket | null;
		}
	>();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.db = createDrizzleClient(env);
		this.roomService = new RoomService(this.db);
		this.gameService = new GameService(this.db);
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

		// 初回接続時にプレイヤー情報を初期化
		if (this.connections.size === 0) {
			await this.initializePlayerConnections(gameId);
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
		this.connections.set(player.id, {
			cards: existingConnections?.cards ?? [],
			isCpu: existingConnections?.isCpu ?? false,
			socket: server,
		});

		// CPUでないプレイヤーが全員接続したらゲーム開始
		if (this.areAllPlayersConnected()) {
			if (this.state !== "waiting") {
				// 待機アラームの削除
				// waiting以外では再接続
				await this.ctx.storage.deleteAlarm();
			}
			await this.startGame();
		}

		// 接続待ちのカウント開始
		// 先に入ったプレイヤーが既にalermをセットしている可能性があるため確認
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + 10000);
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
		await this.ctx.storage.deleteAlarm();
		switch (this.state) {
			case "waiting":
				await this.startGame();
				break;
		}
	}

	/**
	 * ゲーム開始処理
	 * - ラウンド・テーマ・手持ち牌を初期化
	 * - 全プレイヤーにROUND_STARTメッセージを送信
	 */
	private async startGame(): Promise<void> {
		if (!this.gameId) return;

		try {
			const { roundNo, themes, timeLimit, players, playerCards } =
				await this.gameService.initializeGame({
					gameId: this.gameId,
				});

			// ゲーム状態を更新
			this.roundNo = roundNo;
			this.themes = themes;
			this.timeLimit = timeLimit;
			this.players = players;

			// 各プレイヤーの手持ち牌を接続情報に設定
			for (const [playerId, cards] of playerCards) {
				const connection = this.connections.get(playerId);
				if (connection) {
					this.connections.set(playerId, { ...connection, cards });
				}
			}

			// 各プレイヤーにROUND_STARTメッセージを送信
			for (const [playerId, connection] of this.connections) {
				if (!connection.socket) continue;

				try {
					connection.socket.send(
						JSON.stringify({
							game: {
								players: this.players.map((player) => ({
									...player,
									submittedText: null,
								})),
								roundNo: this.roundNo,
								submitted: null,
								theme: this.themes.get(this.roundNo) ?? "",
								timeLimit: this.timeLimit,
							},
							mePlayer: {
								id: playerId,
								playerCards: connection.cards,
							},
							type: "ROUND_START",
						} satisfies GameServerRoundStartMessage),
					);
				} catch (error) {
					const message = `プレイヤー ${playerId} へのROUND_START送信に失敗しました`;
					console.error(message, error);
					// 送信に失敗した場合はそのプレイヤーのみDPUにして接続を切断
					this.connections.set(playerId, {
						...connection,
						isCpu: true,
						socket: null,
					});
					connection.socket.close(1011, message);
				}
			}
			this.state = "submission";
		} catch (error) {
			console.error("ゲーム開始処理に失敗しました:", error);
			// エラー時は全プレイヤーに通知して切断
			for (const [, connection] of this.connections) {
				if (connection.socket) {
					connection.socket.close(1011, "ゲーム開始処理に失敗しました");
				}
			}
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
	 * 初回接続時にプレイヤー情報を初期化する。
	 * - 全プレイヤーをconnectionsに登録（CPUはsocket: null）
	 */
	private async initializePlayerConnections(gameId: GameId): Promise<void> {
		const players = await this.db
			.select({
				id: playerTable.id,
				isCpu: playerTable.isCpu,
			})
			.from(playerTable)
			.where(eq(playerTable.gameId, gameId));

		for (const player of players) {
			this.connections.set(player.id, {
				cards: [],
				isCpu: player.isCpu,
				socket: null,
			});
		}
	}

	/**
	 * 全ての人間プレイヤーが接続済みかどうかを判定する。
	 */
	private areAllPlayersConnected(): boolean {
		for (const [, connection] of this.connections) {
			if (!connection.isCpu && connection.socket === null) {
				return false;
			}
		}
		return true;
	}
}
