import { DurableObject } from "cloudflare:workers";
import {
	type GamePlayerCard,
	type GamePlayerItem,
	type GameServerRoundStartMessage,
	type GameServerTurnEndMessage,
	type GameServerTurnStartMessage,
	type GameServerVoteMessage,
	type GameState,
	gameClientMessageSchema,
} from "@repo/db/model";
import {
	type Game,
	type GameId,
	isGameId,
	isPlayerId,
	type Player,
	type PlayerCard,
	type PlayerId,
	playerTable,
	type RoundNo,
	type RoundTheme,
	type Submission,
} from "@repo/db/schema";
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

/** DurableObject内部で使用するプレイヤー情報（GamePlayerItemを拡張） */
type PlayerState = GamePlayerItem & {
	cards: GamePlayerCard[];
	isCpu: Player["isCpu"];
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
		const { gameId, token } = this.getSearchParams(request);
		this.ensureGameId({ gameId });

		if (!this.webSocketService.isUpgradeRequest(request)) {
			throw new HTTPException(426, {
				message: "Upgrade: websocket を指定してください",
			});
		}

		// CPUでないプレイヤーが全員接続したらゲーム開始
		if (this.areAllPlayersConnected()) {
			if (this.state === "WAITING") {
				await this.handleInitialize();
			} else {
				// 待機アラームの削除（waiting以外では再接続）
				await this.ctx.storage.deleteAlarm();
			}
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
		const existingSocket = this.getPlayerSocket(player.id);
		if (existingSocket) {
			existingSocket.close(4001, "新しい接続に置き換えられました。");
		}

		// Durable Object の context で WebSocket を accept する
		this.ctx.acceptWebSocket(server, [player.id]);

		// 接続待ちのカウント開始
		// 先に入ったプレイヤーが既にalarmをセットしている可能性があるため確認
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

	/**
	 * WebSocketメッセージ受信時のハンドラ
	 */
	async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
		await this.restoreState();

		// 送信元のプレイヤーIDを特定
		const senderId = this.findPlayerIdBySocket(ws);
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
	}

	async alarm(): Promise<void> {
		await this.restoreState();
		if (!this.gameId) return;
		await this.ctx.storage.deleteAlarm();

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
		}

		await this.persistState();
	}

	/**
	 * ラウンド開始オーバーレイ後、最初のターンを開始する
	 */
	private async handleStartFirstTurn(): Promise<void> {
		const currentPlayer = this.getCurrentPlayer();
		if (!currentPlayer) return;

		// 最初のプレイヤーがCPUの場合は自動提出
		if (currentPlayer.isCpu) {
			await this.randomSubmission({ playerId: currentPlayer.id });
			this.state = "SUBMITTED";
			await this.ctx.storage.setAlarm(Date.now() + 1000);
		} else {
			// 人間プレイヤーの場合は提出待機へ
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
		await this.ctx.storage.setAlarm(Date.now() + 1000);
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

		// 次のプレイヤーがCPUの場合は自動提出
		if (nextPlayer.isCpu) {
			await this.randomSubmission({ playerId: nextPlayer.id });
			this.state = "SUBMITTED";
			await this.ctx.storage.setAlarm(Date.now() + 1000);
		} else {
			// 人間プレイヤーの場合は提出待機へ
			this.state = "SUBMISSION";
			await this.broadcastTurnStart();
			await this.ctx.storage.setAlarm(Date.now() + this.timeLimit * 1000);
		}
	}

	/**
	 * ゲーム開始処理
	 * - ラウンド・テーマ・手持ち牌を初期化
	 * - 全プレイヤーにROUND_STARTメッセージを送信
	 */
	private async handleInitialize(): Promise<void> {
		if (!this.gameId) return;

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

			// 各プレイヤーにROUND_STARTメッセージを送信
			this.broadcastRoundStart();

			// 2秒後にTURN_STARTを送信（開始オーバーレイ表示用の待機）
			this.state = "START_PENDING";
			await this.ctx.storage.setAlarm(Date.now() + 2000);
		} catch (error) {
			console.error("ゲーム開始処理に失敗しました:", error);
			// エラー時は全プレイヤーに通知して切断
			for (const { id } of this.players) {
				const socket = this.getPlayerSocket(id);
				socket?.close(1011, "ゲーム開始処理に失敗しました");
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
	private getSearchParams(request: Request): { gameId: GameId; token: string } {
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
	private ensureGameId({ gameId }: { gameId: GameId }): void {
		if (this.gameId && this.gameId !== gameId) {
			throw new HTTPException(409, {
				message: "DurableObjectが異なるgameIdで呼び出されました。",
			});
		}
		this.gameId = gameId;
	}

	/**
	 * プレイヤーIDからアクティブなWebSocketを取得する。
	 * readyState === OPEN の接続のみ返す。
	 */
	private getPlayerSocket(playerId: PlayerId): WebSocket | null {
		const sockets = this.ctx.getWebSockets(playerId);
		// OPENな接続のみ返す
		return (
			sockets.find((socket) => socket.readyState === WebSocket.OPEN) ?? null
		);
	}

	/**
	 * 全ての人間プレイヤーが接続済みかどうかを判定する。
	 */
	private areAllPlayersConnected(): boolean {
		for (const player of this.players) {
			if (!player.isCpu && !this.getPlayerSocket(player.id)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * 全プレイヤーにROUND_STARTメッセージを送信する。
	 */
	private broadcastRoundStart(): void {
		// ラウンドに応じた順番でプレイヤーを並び替え
		const orderedPlayers = this.sortTurnOrderPlayers();

		// turnIndexに基づいて現在のターンプレイヤーを取得（ラウンド開始時は0）
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		for (const player of this.players) {
			const socket = this.getPlayerSocket(player.id);
			if (!socket) continue;

			try {
				socket.send(
					JSON.stringify({
						currentPlayerId,
						game: {
							players: orderedPlayers.map((player) => ({
								id: player.id,
								image: player.image,
								playerName: player.playerName,
								seat: player.seat,
								submission: null,
								winCount: player.winCount,
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
					} satisfies GameServerRoundStartMessage),
				);
			} catch (error) {
				const message = `プレイヤー ${player.id} へのROUND_START送信に失敗しました`;
				console.error(message, error);
				this.switchToCpu({ message, playerId: player.id });
			}
		}
	}

	/**
	 * 全プレイヤーにTURN_STARTメッセージを送信し、タイムアウトアラームを設定する。
	 */
	private async broadcastTurnStart(): Promise<void> {
		// ラウンドに応じた順番でプレイヤーを並び替え
		const orderedPlayers = this.sortTurnOrderPlayers();

		// turnIndexに基づいて現在のターンプレイヤーを取得
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		for (const player of this.players) {
			const socket = this.getPlayerSocket(player.id);
			if (!socket) continue;

			try {
				socket.send(
					JSON.stringify({
						currentPlayerId,
						game: {
							players: orderedPlayers.map((player) => ({
								id: player.id,
								image: player.image,
								playerName: player.playerName,
								seat: player.seat,
								submission: player.submission,
								winCount: player.winCount,
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
					} satisfies GameServerTurnStartMessage),
				);
			} catch (error) {
				const message = `プレイヤー ${player.id} へのTURN_START送信に失敗しました`;
				console.error(message, error);
				this.switchToCpu({ message, playerId: player.id });
			}
		}
	}

	/**
	 * プレイヤーをCPUに切り替え、接続を切断する。
	 */
	private switchToCpu({
		message,
		playerId,
	}: {
		message: string;
		playerId: PlayerId;
	}): void {
		const playerIndex = this.players.findIndex(
			(player) => player.id === playerId,
		);
		if (playerIndex !== -1) {
			const player = this.players[playerIndex];
			if (player) {
				this.players[playerIndex] = { ...player, isCpu: true };
			}
		}
		const socket = this.getPlayerSocket(playerId);
		socket?.close(1011, message);
	}

	/**
	 * 全プレイヤーにVOTE_STARTメッセージを送信し、投票タイムアウトアラームを設定する。
	 */
	private async broadcastVoteStart(): Promise<void> {
		// ラウンドに応じた順番でプレイヤーを並び替え
		const orderedPlayers = this.sortTurnOrderPlayers();

		for (const player of this.players) {
			const socket = this.getPlayerSocket(player.id);
			if (!socket) continue;

			try {
				socket.send(
					JSON.stringify({
						game: {
							players: orderedPlayers.map((player) => ({
								id: player.id,
								image: player.image,
								playerName: player.playerName,
								seat: player.seat,
								submission: player.submission,
								winCount: player.winCount,
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
					} satisfies GameServerVoteMessage),
				);
			} catch (error) {
				const message = `プレイヤー ${player.id} へのVOTE_START送信に失敗しました`;
				console.error(message, error);
				this.switchToCpu({ message, playerId: player.id });
			}
		}

		// 投票タイムアウトアラームを設定
		await this.ctx.storage.setAlarm(Date.now() + this.timeLimit * 1000);
	}

	/**
	 * 全プレイヤーにTURN_ENDメッセージを送信する。
	 */
	private broadcastTurnEnd({
		submission,
	}: {
		submission: Pick<Submission, "position"> & Pick<PlayerCard, "text">;
	}): void {
		// ラウンドに応じた順番でプレイヤーを並び替え
		const orderedPlayers = this.sortTurnOrderPlayers();

		// turnIndexに基づいて現在のターンプレイヤーを取得
		const currentPlayerId = orderedPlayers[this.turnIndex]?.id;
		if (!currentPlayerId) return;

		for (const player of this.players) {
			const socket = this.getPlayerSocket(player.id);
			if (!socket) continue;

			try {
				socket.send(
					JSON.stringify({
						currentPlayerId,
						game: {
							players: orderedPlayers.map((player) => ({
								id: player.id,
								image: player.image,
								playerName: player.playerName,
								seat: player.seat,
								submission: player.submission,
								winCount: player.winCount,
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
					} satisfies GameServerTurnEndMessage),
				);
			} catch (error) {
				const message = `プレイヤー ${player.id} へのTURN_END送信に失敗しました`;
				console.error(message, error);
				this.switchToCpu({ message, playerId: player.id });
			}
		}
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
		this.broadcastTurnEnd({ submission });

		// 1秒後に次のターンへ進む
		await this.ctx.storage.setAlarm(Date.now() + 1000);
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

		// 投票をDBに保存
		try {
			await pRetry(
				async () => {
					if (!this.gameId) return;

					await this.gameService.saveVote({
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
		} catch (error) {
			console.error("投票の保存に失敗しました:", error);
			this.switchToCpu({
				message: "投票の保存に失敗しました。CPUに切り替えます。",
				playerId,
			});
		}
	}

	/**
	 * 投票タイムアウト時の処理
	 * 未投票のプレイヤーにランダム投票させ、結果フェーズへ移行する
	 */
	private async handleVoteTimeout(): Promise<void> {
		if (!this.gameId) return;

		// 投票済みのプレイヤーIDを取得
		const votedPlayerIds = await this.gameService.getVotedPlayerIds({
			gameId: this.gameId,
			roundNo: this.roundNo,
		});

		// 未投票のプレイヤーにランダム投票
		for (const player of this.players) {
			if (!votedPlayerIds.includes(player.id)) {
				// 自分以外のプレイヤーからランダムに選択
				const notMePlayers = this.players.filter(
					(otherPlayer) => otherPlayer.id !== player.id,
				);
				const randomTarget =
					notMePlayers[Math.floor(Math.random() * notMePlayers.length)];

				if (randomTarget) {
					try {
						await this.gameService.saveVote({
							gameId: this.gameId,
							playerId: player.id,
							roundNo: this.roundNo,
							votePlayerId: randomTarget.id,
						});
					} catch (error) {
						console.error(
							`プレイヤー ${player.id} のランダム投票に失敗しました:`,
							error,
						);
						this.disconnectAllPlayers("ランダム投票に失敗しました");
						return;
					}
				}
			}
		}

		this.state = "RESULT";
		// TODO: 結果をブロードキャスト（DBから投票結果を集計して次のラウンドへの移行も含む）
		console.log("投票タイムアウト: 結果フェーズへ移行");
	}

	/**
	 * 全プレイヤーを切断する
	 */
	private disconnectAllPlayers(reason: string): void {
		for (const player of this.players) {
			const socket = this.getPlayerSocket(player.id);
			socket?.close(1011, reason);
		}
	}

	/**
	 * WebSocketからプレイヤーIDを特定する
	 * acceptWebSocket時に設定したタグを使用して特定する
	 */
	private findPlayerIdBySocket(ws: WebSocket): PlayerId | null {
		// タグの最初の要素がプレイヤーID
		const playerId = this.ctx.getTags(ws)[0];

		if (!isPlayerId(playerId)) return null;

		if (this.players.some((player) => player.id === playerId)) {
			return playerId;
		}
		return null;
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
			this.switchToCpu({
				message: "提出処理に失敗しました。CPUに切り替えます。",
				playerId,
			});
			return;
		}

		// メモリ上のプレイヤー状態を更新
		const playerIndex = this.players.findIndex(
			(player) => player.id === playerId,
		);
		if (playerIndex !== -1) {
			const player = this.players[playerIndex];
			if (player) {
				this.players[playerIndex] = {
					...player,
					cards: player.cards.map((card) =>
						card.word === submission.text ? { ...card, used: true } : card,
					),
					submission,
				};
			}
		}
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
		this.broadcastTurnEnd({ submission });
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
}
