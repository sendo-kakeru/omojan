import { DurableObject } from "cloudflare:workers";
import {
	type GamePlayerCard,
	type GamePlayerItem,
	type GameServerGameEndMessage,
	type GameServerReactionMessage,
	type GameServerResultMessage,
	type GameServerRoundStartMessage,
	type GameServerTurnEndMessage,
	type GameServerTurnStartMessage,
	type GameServerVoteMessage,
	type GameState,
	gameClientMessageSchema,
	type ReactionEmoji,
} from "@repo/db/model";
import {
	type Game,
	type GameId,
	gameTable,
	isGameId,
	type Player,
	type PlayerCard,
	type PlayerId,
	playerTable,
	type RoundNo,
	type RoundTheme,
	type Submission,
} from "@repo/db/schema";
import {
	RESULT_DISPLAY_MS,
	VOTE_TIMEOUT_MS,
} from "@repo/shared/constants/game";
import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import pRetry from "p-retry";
import type { Env } from "../../env";
import { createDrizzleClient, type DrizzleClient } from "../../libs/drizzle";
import { RoomService } from "../room/RoomService";
import { WebSocketService } from "../websocket/WebsocketService";
import { GameService } from "./GameService";

/** ctx.storageに永続化するゲーム状態のキー */
const STORAGE_KEY = "GAME_STATE" as const;

/** リアクションの連打判定間隔(ms) */
const REACTION_RATE_LIMIT_MS = 300 as const;

/** ゲーム進行のタイミング定数 (ミリ秒) */
const TIMING = {
	/** 初期接続待機時間 */
	INITIAL_WAIT_MS: 10_000,
	/** ラウンド開始オーバーレイ表示時間 */
	OVERLAY_DISPLAY_MS: 2_000,
	/** 結果表示時間 */
	RESULT_DISPLAY_MS,
	/** 状態遷移間の待機時間 */
	TRANSITION_DELAY_MS: 1_000,
	/** 投票タイムアウト時間 */
	VOTE_TIMEOUT_MS,
} as const;

/** DurableObject内部で使用するプレイヤー情報（GamePlayerItemを拡張） */
type PlayerState = GamePlayerItem & {
	cards: GamePlayerCard[];
	isCpu: Player["isCpu"];
	seat: Player["seat"];
};

/** 永続化するゲーム状態の型 */
type PersistedGameState = {
	gameId: GameId;
	players: PlayerState[];
	roundNo: RoundNo;
	state: GameState;
	themes: Array<[RoundNo, RoundTheme["text"]]>;
	timeLimit: Game["timeLimit"];
	turnIndex: 0 | 1 | 2 | 3;
};

export class GameDurableObject extends DurableObject<Env> {
	private readonly db: DrizzleClient;
	private readonly webSocketService = new WebSocketService();
	private readonly gameService: GameService;
	private readonly roomService: RoomService;
	private gameId: GameId | null = null;
	private state: GameState = "WAITING";
	private roundNo: RoundNo = 1;
	private turnIndex: 0 | 1 | 2 | 3 = 0; // 0〜3: ラウンド内のターン番号
	private themes: Map<RoundNo, RoundTheme["text"]> = new Map();
	private timeLimit = 30;
	private players: PlayerState[] = [];
	/**
	 *　プレイヤーごとのリアクション最終送信時刻
	 *　連打対策
	 */
	private reactionLastSentAt: Map<PlayerId, number> = new Map();

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.db = createDrizzleClient(env);
		this.roomService = new RoomService(this.db);
		this.gameService = new GameService(this.db);
	}

	/**
	 * ゲーム状態をctx.storageに永続化する
	 */
	private async persistState(): Promise<void> {
		if (!this.gameId) return;

		await this.ctx.storage.put(STORAGE_KEY, {
			gameId: this.gameId,
			players: this.players,
			roundNo: this.roundNo,
			state: this.state,
			themes: Array.from(this.themes.entries()),
			timeLimit: this.timeLimit,
			turnIndex: this.turnIndex,
		} satisfies PersistedGameState);
	}

	/**
	 * ctx.storageからゲーム状態を復元する
	 */
	private async restoreState(): Promise<void> {
		const persistedState =
			await this.ctx.storage.get<PersistedGameState>(STORAGE_KEY);

		if (!persistedState) return;

		this.gameId = persistedState.gameId;
		this.state = persistedState.state;
		this.roundNo = persistedState.roundNo;
		this.turnIndex = persistedState.turnIndex;
		this.themes = new Map(persistedState.themes);
		this.timeLimit = persistedState.timeLimit;
		this.players = persistedState.players;
	}

	/**
	 * HTTP/WS のリクエストを受け取り、WebSocket のみを受け付ける。
	 */
	async fetch(request: Request): Promise<Response> {
		// Durable Objectのハイバネーション復帰時に状態を復元
		await this.restoreState();

		const { gameId, token, connectSeq } = this.getSearchParams(request);
		this.ensureGameId({ gameId });

		// ゲームステータスをチェック（終了したゲームへの接続を拒否）
		await this.ensureGameNotFinished({ gameId });

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

		// より新しい接続があったら接続拒否（主にReact strict mode）
		if (
			!this.webSocketService.acceptIfLatestConnect({
				connectSeq,
				playerId: player.id,
			})
		) {
			throw new HTTPException(409, {
				message: "より新しい接続が既に確立されています",
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

		// CPUでないプレイヤーが全員接続したらゲーム開始
		// acceptWebSocketの後に呼ぶことで、最後に接続したプレイヤーにもROUND_STARTが届く
		// 注意: ゲーム進行中のアラーム（TURN_START, VOTE_START等）は削除しない
		const triggeredInit =
			(await this.areAllPlayersConnected()) && this.state === "WAITING";
		if (triggeredInit) {
			await this.handleInitialize();
		}

		// ゲーム開始後に接続した場合、または初期化をトリガーしたプレイヤーの場合、
		// 現在の状態を直接送信する
		// これにより、ブロードキャストでソケットが見つからなかったプレイヤーも確実に状態を受け取れる
		if (this.state !== "WAITING" && this.state !== "INITIALIZING") {
			await this.sendCurrentStateToPlayer({ playerId: player.id, server });
		}

		// 接続待ちのカウント開始
		// 先に入ったプレイヤーが既にalarmをセットしている可能性があるため確認
		const currentAlarm = await this.ctx.storage.getAlarm();
		if (currentAlarm === null) {
			await this.ctx.storage.setAlarm(Date.now() + TIMING.INITIAL_WAIT_MS);
		}

		// gameIdを永続化してハイバネーション復帰時にalarmが正しく動作するようにする
		await this.persistState();

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
	 * WebSocketメッセージ受信時のハンドラ
	 */
	async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
		// 送信元のプレイヤーIDを特定
		const senderId = this.webSocketService.getPlayerIdBySocket({
			ctx: this.ctx,
			ws,
		});
		if (!senderId) {
			ws.close(1003, "送信元のプレイヤーが特定できませんでした。");
			return;
		}

		const parsedMessage = this.webSocketService.parseClientMessage({
			message,
			schema: gameClientMessageSchema,
			ws,
		});
		if (!parsedMessage) return;

		// リアクション: 排他制御なしで処理（ゲーム状態に影響しない）
		if (parsedMessage.type === "REACTION") {
			await this.handleReaction({
				emoji: parsedMessage.emoji,
				playerId: senderId,
			});
			return;
		}

		// SUBMIT/VOTE: 排他制御を取得してゲーム状態を安全に更新
		await this.ctx.blockConcurrencyWhile(async () => {
			await this.restoreState();

			switch (parsedMessage.type) {
				case "SUBMIT":
					await this.handleSubmission({
						playerId: senderId,
						submission: parsedMessage.submission,
					});
					break;
				case "VOTE":
					await this.handleVote({
						playerId: senderId,
						votePlayerId: parsedMessage.votePlayerId,
					});
					break;
			}

			await this.persistState();
		});
	}

	async alarm(): Promise<void> {
		await this.restoreState();
		if (!this.gameId) return;
		await this.ctx.storage.deleteAlarm();

		try {
			switch (this.state) {
				case "WAITING":
					await this.handleInitialize();
					break;
				case "START_PENDING":
					await this.handleStartFirstTurn();
					break;
				case "SUBMISSION":
					await this.handleSubmissionTimeout();
					break;
				case "SUBMITTED":
					await this.proceedToNextTurn();
					break;
				case "VOTING":
					await this.handleVoteTimeout();
					break;
				case "RESULT":
					await this.proceedToNextRound();
					break;
			}
		} catch (error) {
			console.error(
				`alarmハンドラで未処理エラーが発生しました (state=${this.state}):`,
				error,
			);
			await this.handleGameAbort({
				message: `alarmハンドラで未処理エラーが発生しました (state=${this.state})`,
			});
			return;
		}

		await this.persistState();
	}

	/**
	 * ラウンド開始オーバーレイ後、最初のターンを開始する
	 */
	private async handleStartFirstTurn(): Promise<void> {
		const currentPlayer = this.getCurrentPlayer();
		if (!currentPlayer) return;

		await this.startTurnForPlayer(currentPlayer);
	}

	/**
	 * プレイヤーのターンを開始する
	 * CPUの場合は自動提出、人間の場合はTURN_STARTをブロードキャスト
	 */
	private async startTurnForPlayer(player: PlayerState): Promise<void> {
		if (player.isCpu) {
			await this.randomSubmission({ playerId: player.id });
			this.state = "SUBMITTED";
			await this.ctx.storage.setAlarm(Date.now() + TIMING.TRANSITION_DELAY_MS);
		} else {
			this.state = "SUBMISSION";
			await this.broadcastTurnStart();
			await this.ctx.storage.setAlarm(Date.now() + this.timeLimit * 1000);
		}
	}

	/**
	 * 提出タイムアウト時の処理
	 * タイムアウトしたプレイヤーをランダム提出させる
	 */
	private async handleSubmissionTimeout(): Promise<void> {
		const currentPlayerId = this.getCurrentPlayer()?.id;
		if (!currentPlayerId) return;

		await this.randomSubmission({ playerId: currentPlayerId });
		this.state = "SUBMITTED";
		await this.ctx.storage.setAlarm(Date.now() + TIMING.TRANSITION_DELAY_MS);
	}

	/**
	 * 提出結果表示後、次のターンまたは投票フェーズへ進む
	 */
	private async proceedToNextTurn(): Promise<void> {
		// 4人全員が提出完了した場合は投票フェーズへ移行
		if (this.turnIndex >= 3) {
			this.state = "VOTING";
			await this.broadcastVoteStart();
			return;
		}

		// 次のターンへ
		this.turnIndex = (this.turnIndex + 1) as 0 | 1 | 2 | 3;
		const nextPlayer = this.getCurrentPlayer();
		if (!nextPlayer) return;

		await this.startTurnForPlayer(nextPlayer);
	}

	/**
	 * ゲーム開始処理
	 * - ラウンド・テーマ・手持ち牌を初期化
	 * - 全プレイヤーにROUND_STARTメッセージを送信
	 */
	private async handleInitialize(): Promise<void> {
		if (!this.gameId) return;

		// 重複実行を防ぐため、状態を先に変更
		this.state = "INITIALIZING";

		try {
			const { players, roundNo, themes, timeLimit } =
				await this.gameService.initializeGame({
					gameId: this.gameId,
				});

			// ゲーム状態を更新
			this.roundNo = roundNo;
			this.themes = themes;
			this.timeLimit = timeLimit;
			this.players = players;
			this.turnIndex = 0; // ラウンド開始時はターン0から

			// 状態をSTART_PENDINGに変更してからブロードキャスト
			// これにより、broadcastRoundStart中に接続したプレイヤーも
			// fetch()でsendCurrentStateToPlayer()を受け取れる
			this.state = "START_PENDING";

			// 各プレイヤーにROUND_STARTメッセージを送信
			// ソケットが見つからない場合はスキップ（fetch()でsendCurrentStateToPlayer()が呼ばれる）
			await this.broadcastRoundStart();

			// 2秒後にTURN_STARTを送信（開始オーバーレイ表示用の待機）
			await this.ctx.storage.setAlarm(Date.now() + TIMING.OVERLAY_DISPLAY_MS);
		} catch (error) {
			console.error("ゲーム開始処理に失敗しました:", error);
			// エラー時は異常終了処理を実行
			await this.handleGameAbort({ message: "ゲーム開始処理に失敗しました" });
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
	 * 共通クエリ（token / gameId / connectSeq）を抽出し検証する。
	 */
	private getSearchParams(request: Request): {
		gameId: GameId;
		token: string;
		connectSeq: number;
	} {
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

		const connectSeqParam = url.searchParams.get("connectSeq");
		const connectSeq = Number(connectSeqParam);
		if (connectSeqParam === null || !Number.isFinite(connectSeq)) {
			throw new HTTPException(400, { message: "connectSeqが正しくありません" });
		}

		return {
			connectSeq,
			gameId,
			token,
		};
	}

	/**
	 * DurableObject が単一の gameId だけを扱うよう制限する。
	 */
	private ensureGameId({ gameId }: { gameId: GameId }): void {
		if (this.gameId && this.gameId !== gameId) {
			throw new HTTPException(409, {
				message: "DurableObjectが異なるgameIdで呼び出されました。",
			});
		}
		this.gameId = gameId;
	}

	/**
	 * ゲームが終了していないことを確認する。
	 * 終了したゲームへの接続を拒否する。
	 */
	private async ensureGameNotFinished({
		gameId,
	}: {
		gameId: GameId;
	}): Promise<void> {
		const [game] = await this.db
			.select({ status: gameTable.status })
			.from(gameTable)
			.where(eq(gameTable.id, gameId));

		if (!game) {
			throw new HTTPException(404, {
				message: "指定されたゲームが存在しません",
			});
		}

		if (game.status === "finished") {
			throw new HTTPException(410, {
				message: "このゲームは終了しています",
			});
		}
	}

	/**
	 * 全ての人間プレイヤーが接続済みかどうかを判定する。
	 * 初期化前でthis.playersが空の場合はDBから取得してチェックする。
	 */
	private async areAllPlayersConnected(): Promise<boolean> {
		// this.playersが既にある場合はそれを使用
		if (this.players.length > 0) {
			for (const player of this.players) {
				if (
					!player.isCpu &&
					!this.webSocketService.getPlayerSocket({
						ctx: this.ctx,
						playerId: player.id,
					})
				) {
					return false;
				}
			}
			return true;
		}

		// 初期化前はDBからプレイヤーリストを取得
		if (!this.gameId) return false;

		const players = await this.db
			.select({
				id: playerTable.id,
				isCpu: playerTable.isCpu,
			})
			.from(playerTable)
			.where(eq(playerTable.gameId, this.gameId));

		if (players.length === 0) return false;

		for (const player of players) {
			if (
				!player.isCpu &&
				!this.webSocketService.getPlayerSocket({
					ctx: this.ctx,
					playerId: player.id,
				})
			) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 全プレイヤーにROUND_STARTメッセージを送信する。
	 */
	private async broadcastRoundStart(): Promise<void> {
		const orderedPlayers = this.sortTurnOrderPlayers();
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		await this.broadcastToPlayers({
			createMessage: (player) =>
				({
					currentPlayerId,
					game: {
						players: orderedPlayers.map((p) => ({
							id: p.id,
							image: p.image,
							playerName: p.playerName,
							submission: null,
							winCount: p.winCount,
						})),
						roundNo: this.roundNo,
						submitted: null,
						theme: this.themes.get(this.roundNo) ?? "",
						timeLimit: this.timeLimit,
					},
					mePlayer: {
						id: player.id,
						playerCards: player.cards,
					},
					type: "ROUND_START",
				}) satisfies GameServerRoundStartMessage,
		});
	}

	/**
	 * 全プレイヤーにTURN_STARTメッセージを送信する。
	 */
	private async broadcastTurnStart(): Promise<void> {
		const orderedPlayers = this.sortTurnOrderPlayers();
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		await this.broadcastToPlayers({
			createMessage: (player) =>
				({
					currentPlayerId,
					game: {
						players: orderedPlayers.map((p) => ({
							id: p.id,
							image: p.image,
							playerName: p.playerName,
							submission: p.submission,
							winCount: p.winCount,
						})),
						roundNo: this.roundNo,
						submitted: null,
						theme: this.themes.get(this.roundNo) ?? "",
						timeLimit: this.timeLimit,
					},
					mePlayer: {
						id: player.id,
						playerCards: player.cards,
					},
					type: "TURN_START",
				}) satisfies GameServerTurnStartMessage,
		});
	}

	/**
	 * 各プレイヤーにメッセージを送信する。
	 * ソケットが見つからない場合はスキップ（再接続時にfetch()でsendCurrentStateToPlayer()が呼ばれる）。
	 * 送信に失敗した場合はCPUに切り替える。
	 * @param createMessage 各プレイヤーに対して送信するメッセージを生成する関数
	 */
	private async broadcastToPlayers({
		createMessage,
	}: {
		createMessage: (player: PlayerState) => object;
	}): Promise<void> {
		const playersToSwitch: PlayerId[] = [];

		for (const player of this.players) {
			const socket = this.webSocketService.getPlayerSocket({
				ctx: this.ctx,
				playerId: player.id,
			});

			// ソケットが見つからない場合はスキップ
			// 一時的な切断や再接続中の可能性があり、fetch()でsendCurrentStateToPlayer()が呼ばれる
			// タイムアウトはalarmで処理される
			if (!socket) {
				continue;
			}

			try {
				socket.send(JSON.stringify(createMessage(player)));
			} catch (error) {
				// 送信失敗はソケットの問題なのでCPUに切り替え
				console.error(`プレイヤー ${player.id} への送信に失敗しました:`, error);
				if (!player.isCpu) {
					playersToSwitch.push(player.id);
				}
			}
		}

		for (const playerId of playersToSwitch) {
			await this.switchToCpu({
				message: "メッセージ送信に失敗したためCPUに切り替えます",
				playerId,
			});
		}
	}

	/**
	 * プレイヤーをCPUに切り替え、接続を切断する。
	 * 全員がCPUになった場合は部屋を削除する。
	 */
	private async switchToCpu({
		message,
		playerId,
	}: {
		message: string;
		playerId: PlayerId;
	}): Promise<void> {
		this.updatePlayer(playerId, () => ({ isCpu: true }));

		const socket = this.webSocketService.getPlayerSocket({
			ctx: this.ctx,
			playerId,
		});
		socket?.close(1011, message);

		// 全員がCPUになった場合は部屋を削除
		if (this.areAllPlayersCpu()) {
			await this.handleGameAbort({
				message: "全プレイヤーが切断したためゲームを終了しました",
			});
		}
	}

	/**
	 * 全プレイヤーがCPUかどうかを判定する
	 */
	private areAllPlayersCpu(): boolean {
		return (
			this.players.length > 0 && this.players.every((player) => player.isCpu)
		);
	}

	/**
	 * プレイヤーの状態を更新する
	 * @param playerId 更新対象のプレイヤーID
	 * @param getUpdates 現在の状態から更新内容を生成する関数
	 */
	private updatePlayer(
		playerId: PlayerId,
		getUpdates: (player: PlayerState) => Partial<PlayerState>,
	): void {
		const index = this.players.findIndex((p) => p.id === playerId);
		if (index === -1) return;

		const player = this.players[index];
		if (!player) return;

		this.players[index] = { ...player, ...getUpdates(player) };
	}

	/**
	 * 全プレイヤーにVOTE_STARTメッセージを送信し、CPUプレイヤーの自動投票を行い、
	 * 投票タイムアウトアラームを設定する。
	 */
	private async broadcastVoteStart(): Promise<void> {
		if (!this.gameId) return;

		const orderedPlayers = this.sortTurnOrderPlayers();

		await this.broadcastToPlayers({
			createMessage: (player) =>
				({
					game: {
						players: orderedPlayers.map((p) => ({
							id: p.id,
							image: p.image,
							playerName: p.playerName,
							submission: p.submission,
							winCount: p.winCount,
						})),
						roundNo: this.roundNo,
						theme: this.themes.get(this.roundNo) ?? "",
						timeLimit: this.timeLimit,
					},
					mePlayer: {
						id: player.id,
						playerCards: player.cards,
					},
					type: "VOTE_START",
				}) satisfies GameServerVoteMessage,
		});

		await this.ctx.storage.setAlarm(Date.now() + TIMING.VOTE_TIMEOUT_MS);

		// CPUプレイヤーの自動投票
		// 失敗した場合は投票タイムアウト（handleVoteTimeout）で再試行される
		for (const player of this.players) {
			if (player.isCpu) {
				try {
					await this.randomVote({ playerId: player.id });
				} catch (error) {
					console.warn(
						`CPUプレイヤー ${player.id} の自動投票に失敗しました。投票タイムアウト時に再試行されます:`,
						error,
					);
				}
			}
		}
	}

	/**
	 * 全プレイヤーにRESULTメッセージを送信する。
	 */
	private async broadcastResult({
		playerVoteCounts,
		winnerPlayerIds,
	}: {
		playerVoteCounts: Map<PlayerId, number>;
		winnerPlayerIds: PlayerId[];
	}): Promise<void> {
		const orderedPlayers = this.sortTurnOrderPlayers();

		await this.broadcastToPlayers({
			createMessage: (player) =>
				({
					game: {
						players: orderedPlayers.map((p) => ({
							id: p.id,
							image: p.image,
							playerName: p.playerName,
							submission: p.submission,
							voteCount: playerVoteCounts.get(p.id) ?? 0,
							winCount: p.winCount,
						})),
						roundNo: this.roundNo,
						theme: this.themes.get(this.roundNo) ?? "",
						timeLimit: this.timeLimit,
						winnerPlayerIds,
					},
					mePlayer: {
						id: player.id,
						playerCards: player.cards,
					},
					type: "RESULT",
				}) satisfies GameServerResultMessage,
		});
	}

	/**
	 * 全プレイヤーにTURN_ENDメッセージを送信する。
	 */
	private async broadcastTurnEnd({
		submission,
	}: {
		submission: Pick<Submission, "position"> & Pick<PlayerCard, "text">;
	}): Promise<void> {
		const orderedPlayers = this.sortTurnOrderPlayers();
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		await this.broadcastToPlayers({
			createMessage: (player) =>
				({
					currentPlayerId,
					game: {
						players: orderedPlayers.map((p) => ({
							id: p.id,
							image: p.image,
							playerName: p.playerName,
							submission: p.submission,
							winCount: p.winCount,
						})),
						roundNo: this.roundNo,
						submitted: submission,
						theme: this.themes.get(this.roundNo) ?? "",
						timeLimit: this.timeLimit,
					},
					mePlayer: {
						id: player.id,
						playerCards: player.cards,
					},
					type: "TURN_END",
				}) satisfies GameServerTurnEndMessage,
		});
	}

	/**
	 * 提出処理
	 */
	private async handleSubmission({
		playerId,
		submission,
	}: {
		playerId: PlayerId;
		submission: Pick<Submission, "position"> & Pick<PlayerCard, "text">;
	}): Promise<void> {
		if (this.state !== "SUBMISSION" || !this.gameId) return;

		// 現在のターンプレイヤーか確認
		const currentPlayerId = this.getCurrentPlayer()?.id;
		if (currentPlayerId !== playerId) {
			console.warn("提出したプレイヤーのターンではありません。");
			return;
		}

		// 既に提出済みか確認
		const submitPlayer = this.players.find((player) => player.id === playerId);
		if (submitPlayer?.submission) {
			console.warn("提出済みです。");
			return;
		}

		// 提出を処理（DB保存、メモリ更新、カード使用済み）
		await this.submitPlayerCard({ playerId, submission });

		// 状態をSUBMITTEDに変更
		this.state = "SUBMITTED";

		// TURN_ENDをブロードキャスト
		await this.broadcastTurnEnd({ submission });

		// 1秒後に次のターンへ進む
		await this.ctx.storage.setAlarm(Date.now() + TIMING.TRANSITION_DELAY_MS);
	}

	/**
	 * 投票処理
	 */
	private async handleVote({
		playerId,
		votePlayerId,
	}: {
		playerId: PlayerId;
		votePlayerId: PlayerId;
	}): Promise<void> {
		if (this.state !== "VOTING" || !this.gameId) return;

		// 自分に投票することはできない
		if (playerId === votePlayerId) {
			console.warn("自分自身に投票することはできません。");
			return;
		}

		// 投票先が存在するか確認
		const targetPlayer = this.players.find(
			(player) => player.id === votePlayerId,
		);
		if (!targetPlayer) {
			console.warn("投票先のプレイヤーが存在しません。");
			return;
		}

		// 投票をDBに保存し、同一トランザクション内で投票数を取得
		let voteCount = 0;
		try {
			const result = await pRetry(
				async () => {
					if (!this.gameId) return { voteCount: 0 };

					return await this.gameService.saveVote({
						gameId: this.gameId,
						playerId,
						roundNo: this.roundNo,
						votePlayerId,
					});
				},
				{
					retries: 3,
				},
			);
			voteCount = result.voteCount;
		} catch (error) {
			console.error("投票の保存に失敗しました:", error);
			await this.switchToCpu({
				message: "投票の保存に失敗しました。CPUに切り替えます。",
				playerId,
			});
			return;
		}

		// 全員投票完了か確認（トランザクション内で取得した投票数を使用）
		if (voteCount >= this.players.length) {
			await this.ctx.storage.deleteAlarm();
			// 結果フェーズへ移行
			await this.proceedToResult();
		}
	}

	/**
	 * リアクション処理
	 * ゲーム状態に影響を与えず、全プレイヤーにブロードキャストする
	 */
	private async handleReaction({
		emoji,
		playerId,
	}: {
		emoji: ReactionEmoji;
		playerId: PlayerId;
	}): Promise<void> {
		// 連打防止判定
		const now = Date.now();
		const lastSentAt = this.reactionLastSentAt.get(playerId) ?? 0;
		if (now - lastSentAt < REACTION_RATE_LIMIT_MS) {
			return;
		}
		this.reactionLastSentAt.set(playerId, now);

		const playerName = await this.resolvePlayerName({ playerId });
		if (!playerName) return;

		this.webSocketService.broadcastJson({
			payload: {
				emoji,
				playerName,
				type: "REACTION",
			} satisfies GameServerReactionMessage,
			sockets: this.ctx.getWebSockets(),
		});
	}

	/**
	 * プレイヤー名を取得
	 */
	private async resolvePlayerName({
		playerId,
	}: {
		playerId: PlayerId;
	}): Promise<string | undefined> {
		if (this.players.length > 0) {
			return this.players.find((p) => p.id === playerId)?.playerName;
		}
		const persisted =
			await this.ctx.storage.get<PersistedGameState>(STORAGE_KEY);
		return persisted?.players.find((p) => p.id === playerId)?.playerName;
	}

	/**
	 * 投票タイムアウト時の処理
	 * 未投票のプレイヤーにランダム投票させ、結果フェーズへ移行する
	 */
	private async handleVoteTimeout(): Promise<void> {
		if (!this.gameId) return;

		// 投票済みのプレイヤーIDを取得
		let votedPlayerIds: PlayerId[];
		try {
			votedPlayerIds = await this.gameService.getVotedPlayerIds({
				gameId: this.gameId,
				roundNo: this.roundNo,
			});
		} catch (error) {
			console.error("投票済みプレイヤーの取得に失敗しました:", error);
			await this.handleGameAbort({
				message: "投票済みプレイヤーの取得に失敗しました",
			});
			return;
		}

		// 未投票のプレイヤーにランダム投票
		for (const player of this.players) {
			if (!votedPlayerIds.includes(player.id)) {
				try {
					await this.randomVote({ playerId: player.id });
				} catch (error) {
					console.error(
						`プレイヤー ${player.id} のランダム投票に失敗しました:`,
						error,
					);
					await this.handleGameAbort({ message: "ランダム投票に失敗しました" });
					return;
				}
			}
		}

		// 結果フェーズへ移行
		await this.proceedToResult();
	}

	/**
	 * 結果フェーズへ移行する
	 * - 勝者と得票数を計算
	 * - 勝者のwinCountを更新
	 * - 結果をブロードキャスト
	 * - 次のラウンドへのアラームを設定
	 */
	private async proceedToResult(): Promise<void> {
		if (!this.gameId) return;

		try {
			// 勝者と得票数を計算
			const { playerVoteCounts, winnerPlayerIds } =
				await this.gameService.calculateRoundWinnersWithVoteCounts({
					gameId: this.gameId,
					roundNo: this.roundNo,
				});

			// 勝者のwinCountを更新
			for (const winnerId of winnerPlayerIds) {
				this.updatePlayer(winnerId, (p) => ({ winCount: p.winCount + 1 }));
			}

			this.state = "RESULT";
			await this.broadcastResult({ playerVoteCounts, winnerPlayerIds });
			// 6秒後に次のラウンドへ（または終了処理）
			await this.ctx.storage.setAlarm(Date.now() + TIMING.RESULT_DISPLAY_MS);
		} catch (error) {
			console.error("結果フェーズの処理に失敗しました:", error);
			await this.handleGameAbort({
				message: "結果フェーズの処理に失敗しました",
			});
			return;
		}
	}

	/**
	 * 次のラウンドへ進む、または全ラウンド終了時はゲーム終了処理を行う
	 */
	private async proceedToNextRound(): Promise<void> {
		// 4ラウンド終了したらゲーム終了
		if (this.roundNo === 4) {
			await this.handleGameEnd();
			return;
		}

		// 次のラウンドへ
		const nextRoundNo = this.roundNo + 1;
		if (nextRoundNo !== 2 && nextRoundNo !== 3 && nextRoundNo !== 4) {
			return;
		}

		this.roundNo = nextRoundNo;
		this.turnIndex = 0;

		// プレイヤーの提出状態をリセット
		for (let i = 0; i < this.players.length; i++) {
			const player = this.players[i];
			if (player) {
				this.players[i] = {
					...player,
					submission: null,
				};
			}
		}

		// ROUND_STARTを送信
		await this.broadcastRoundStart();

		// 2秒後にTURN_STARTを送信（開始オーバーレイ表示用の待機）
		this.state = "START_PENDING";
		await this.ctx.storage.setAlarm(Date.now() + TIMING.OVERLAY_DISPLAY_MS);
	}

	/**
	 * ゲーム終了処理（正常終了）
	 * - ゲームステータスを終了に更新
	 * - 全プレイヤーにENDメッセージを送信
	 * - 全プレイヤーを切断
	 * - クリーンアップ処理を実行
	 */
	private async handleGameEnd(): Promise<void> {
		if (!this.gameId) return;

		try {
			await this.gameService.endGame({ gameId: this.gameId });
		} catch (error) {
			console.error("ゲームステータスの更新に失敗しました:", error);
		}

		// ENDメッセージを送信し、送信成功したプレイヤーを正常終了で切断
		for (const player of this.players) {
			const socket = this.webSocketService.getPlayerSocket({
				ctx: this.ctx,
				playerId: player.id,
			});
			if (!socket) continue;

			try {
				socket.send(
					JSON.stringify({
						type: "END",
					} satisfies GameServerGameEndMessage),
				);
				socket.close(1000, "ゲーム終了");
			} catch (error) {
				console.error(
					`プレイヤー ${player.id} へのEND送信に失敗しました`,
					error,
				);
				socket.close(1011, "ゲーム終了処理に失敗しました");
			}
		}

		// クリーンアップ処理
		await this.cleanup();
	}

	/**
	 * ゲーム異常終了処理
	 * - 部屋を削除
	 * - 全プレイヤーを切断
	 * - クリーンアップ処理を実行
	 */
	private async handleGameAbort({
		code = 1011,
		message,
	}: {
		code?: number;
		message: string;
	}): Promise<void> {
		console.error(`ゲーム異常終了: ${message}`);

		// 部屋を削除
		if (this.gameId) {
			try {
				await this.gameService.deleteGame({ gameId: this.gameId });
			} catch (error) {
				console.error("部屋の削除に失敗しました:", error);
			}
		}

		// 全プレイヤーを切断
		for (const player of this.players) {
			const socket = this.webSocketService.getPlayerSocket({
				ctx: this.ctx,
				playerId: player.id,
			});
			socket?.close(code, message);
		}

		// クリーンアップ処理
		await this.cleanup();
	}

	/**
	 * DurableObjectのクリーンアップ処理
	 * - アラームの削除
	 * - 永続化データの削除
	 * - メモリ状態のリセット
	 */
	private async cleanup(): Promise<void> {
		// アラームの削除
		try {
			await this.ctx.storage.deleteAlarm();
		} catch (error) {
			console.error("アラームの削除に失敗しました:", error);
		}

		// 永続化データの削除
		try {
			await this.ctx.storage.delete(STORAGE_KEY);
		} catch (error) {
			console.error("永続化状態のクリアに失敗しました:", error);
		}

		// メモリ状態のリセット
		this.gameId = null;
		this.state = "WAITING";
		this.roundNo = 1;
		this.turnIndex = 0;
		this.themes = new Map();
		this.timeLimit = 30;
		this.players = [];
	}

	/**
	 * ゲーム開始後に接続したプレイヤーに現在の状態を送信する
	 */
	private async sendCurrentStateToPlayer({
		playerId,
		server,
	}: {
		playerId: PlayerId;
		server: WebSocket;
	}): Promise<void> {
		const player = this.players.find((p) => p.id === playerId);
		if (!player) return;

		const orderedPlayers = this.sortTurnOrderPlayers();
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		const baseGameData = {
			players: orderedPlayers.map((p) => ({
				id: p.id,
				image: p.image,
				playerName: p.playerName,
				submission: p.submission,
				winCount: p.winCount,
			})),
			roundNo: this.roundNo,
			theme: this.themes.get(this.roundNo) ?? "",
			timeLimit: this.timeLimit,
		};

		const mePlayerData = {
			id: player.id,
			playerCards: player.cards,
		};

		try {
			switch (this.state) {
				case "START_PENDING":
				case "SUBMISSION":
				case "SUBMITTED":
					// ROUND_STARTまたはTURN_STARTを送信
					server.send(
						JSON.stringify({
							currentPlayerId,
							game: {
								...baseGameData,
								submitted: null,
							},
							mePlayer: mePlayerData,
							type:
								this.state === "START_PENDING" ? "ROUND_START" : "TURN_START",
						} satisfies
							| GameServerRoundStartMessage
							| GameServerTurnStartMessage),
					);
					break;
				case "VOTING":
					server.send(
						JSON.stringify({
							game: baseGameData,
							mePlayer: mePlayerData,
							type: "VOTE_START",
						} satisfies GameServerVoteMessage),
					);
					break;
				case "RESULT":
					// RESULT状態では得票数が必要なため、簡易的にROUND_STARTを送信
					// （次のラウンドで正しい状態が送られる）
					server.send(
						JSON.stringify({
							currentPlayerId,
							game: {
								...baseGameData,
								submitted: null,
							},
							mePlayer: mePlayerData,
							type: "ROUND_START",
						} satisfies GameServerRoundStartMessage),
					);
					break;
			}
		} catch (error) {
			console.error(
				`プレイヤー ${playerId} への現在状態送信に失敗しました:`,
				error,
			);
		}
	}

	/**
	 * プレイヤーの提出を処理する（DB保存、メモリ状態更新、カード使用済み）
	 */
	private async submitPlayerCard({
		playerId,
		submission,
	}: {
		playerId: PlayerId;
		submission: Pick<Submission, "position"> & Pick<PlayerCard, "text">;
	}): Promise<void> {
		// DBに提出を保存
		try {
			await pRetry(
				async () => {
					if (!this.gameId) return;

					await this.gameService.saveSubmission({
						gameId: this.gameId,
						playerId,
						position: submission.position,
						roundNo: this.roundNo,
						text: submission.text,
					});
				},
				{
					retries: 3,
				},
			);
		} catch (error) {
			console.error("提出処理に失敗しました:", error);
			await this.switchToCpu({
				message: "提出処理に失敗しました。CPUに切り替えます。",
				playerId,
			});
			return;
		}

		// メモリ上のプレイヤー状態を更新
		this.updatePlayer(playerId, (p) => ({
			cards: p.cards.map((card) =>
				card.word === submission.text ? { ...card, used: true } : card,
			),
			submission,
		}));
	}

	/**
	 * ランダムに提出する（待機なし、alarmを設定しない）
	 * CPUのターンと時間切れて使用
	 */
	private async randomSubmission({
		playerId,
	}: {
		playerId: PlayerId;
	}): Promise<void> {
		const player = this.players.find((player) => player.id === playerId);
		if (!player || !this.gameId) return;

		// 未使用のカードからランダムに選択
		const unusedCards = player.cards.filter((card) => !card.used);
		const randomCard =
			unusedCards[Math.floor(Math.random() * unusedCards.length)];
		if (!randomCard) return;

		// ランダムにprefixまたはsuffixを選択
		const position: Submission["position"] =
			Math.random() < 0.5 ? "prefix" : "suffix";

		const submission = { position, text: randomCard.word };

		// 提出を処理（DB保存、メモリ更新、カード使用済み）
		await this.submitPlayerCard({ playerId, submission });

		// TURN_ENDをブロードキャスト
		await this.broadcastTurnEnd({ submission });
	}

	/**
	 * 現在のターンプレイヤーを取得する。
	 */
	private getCurrentPlayer(): PlayerState | undefined {
		return this.sortTurnOrderPlayers()[this.turnIndex];
	}

	/**
	 * ラウンドに応じた順番でプレイヤーを並び替えて返す。
	 */
	private sortTurnOrderPlayers(): PlayerState[] {
		return this.gameService.sortTurnOrderPlayers({
			players: this.players,
			roundNo: this.roundNo,
		});
	}

	/**
	 * 指定したプレイヤーにランダム投票
	 */
	private async randomVote({
		playerId,
	}: {
		playerId: PlayerId;
	}): Promise<void> {
		const gameId = this.gameId;
		if (!gameId) return;

		// 自分以外のプレイヤーからランダムに選択
		const otherPlayers = this.players.filter(
			(player) => player.id !== playerId,
		);
		const randomTarget =
			otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

		if (!randomTarget) return;

		await pRetry(
			async () => {
				await this.gameService.saveVote({
					gameId,
					playerId,
					roundNo: this.roundNo,
					votePlayerId: randomTarget.id,
				});
			},
			{
				retries: 3,
			},
		);
	}
}
