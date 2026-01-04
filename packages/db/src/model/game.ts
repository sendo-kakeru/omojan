import {
	array,
	boolean,
	type InferOutput,
	literal,
	nullable,
	number,
	object,
	pick,
	string,
	union,
	null as valibotNull,
	variant,
} from "valibot";
import {
	gameIdSchema,
	gameSchema,
	playerCardSchema,
	playerIdSchema,
	playerSchema,
	roundSchema,
	roundThemeSchema,
	submissionSchema,
	userSchema,
} from "../schema";

const gameStateSchema = union([
	/**
	 * プレイヤーの接続待機中
	 */
	literal("WAITING"),
	/**
	 * ゲーム初期化中（重複実行防止用）
	 */
	literal("INITIALIZING"),
	/**
	 * ラウンド開始前の待機中（開始オーバーレイ表示中）
	 */
	literal("START_PENDING"),
	/**
	 * プレイヤーがカードを提出できる状態。提出待ち。
	 */
	literal("SUBMISSION"),
	/**
	 * 提出完了後の待機中（提出表示中。数秒後に次のターンへ）
	 */
	literal("SUBMITTED"),
	/**
	 * 投票フェーズ
	 */
	literal("VOTING"),
	/**
	 * 結果表示フェーズ
	 */
	literal("RESULT"),
]);
export type GameState = InferOutput<typeof gameStateSchema>;

const gamePlayerCardSchema = object({
	...pick(playerCardSchema, ["id"]).entries,
	used: boolean(),
	word: playerCardSchema.entries.text,
});
export type GamePlayerCard = InferOutput<typeof gamePlayerCardSchema>;

const playerSubmissionSchema = object({
	position: submissionSchema.entries.position,
	text: playerCardSchema.entries.text,
});

const gamePlayerItemSchema = object({
	...pick(playerSchema, ["id", "playerName", "seat"]).entries,
	...pick(userSchema, ["image"]).entries,
	submission: nullable(playerSubmissionSchema),
	winCount: number(),
});
export type GamePlayerItem = InferOutput<typeof gamePlayerItemSchema>;

const gameBaseSchema = object({
	game: object({
		...pick(gameSchema, ["timeLimit"]).entries,
		...pick(roundSchema, ["roundNo"]).entries,
		players: array(gamePlayerItemSchema),
		theme: roundThemeSchema.entries.text,
	}),
	mePlayer: object({
		id: playerIdSchema,
		playerCards: array(gamePlayerCardSchema),
	}),
});
const gameSubmissionBaseSchema = object({
	...gameBaseSchema.entries,
	currentPlayerId: playerIdSchema,
	game: object({
		...gameBaseSchema.entries.game.entries,
		players: array(
			object({
				...gameBaseSchema.entries.game.entries.players.item.entries,
				submission: nullable(playerSubmissionSchema),
			}),
		),
	}),
});

// 提出
const submitSchema = object({
	...pick(submissionSchema, ["position"]).entries,
	...pick(playerCardSchema, ["text"]).entries,
});

const gameServerRoundStartMessageSchema = object({
	...gameSubmissionBaseSchema.entries,
	game: object({
		...gameSubmissionBaseSchema.entries.game.entries,
		submitted: valibotNull(),
	}),
	type: literal("ROUND_START"),
});

export type GameServerRoundStartMessage = InferOutput<
	typeof gameServerRoundStartMessageSchema
>;

const gameServerTurnStartMessageSchema = object({
	...gameSubmissionBaseSchema.entries,
	game: object({
		...gameSubmissionBaseSchema.entries.game.entries,
		submitted: valibotNull(),
	}),
	type: literal("TURN_START"),
});

export type GameServerTurnStartMessage = InferOutput<
	typeof gameServerTurnStartMessageSchema
>;

const gameServerTurnEndMessageSchema = object({
	...gameSubmissionBaseSchema.entries,
	game: object({
		...gameSubmissionBaseSchema.entries.game.entries,
		submitted: submitSchema,
	}),
	type: literal("TURN_END"),
});

export type GameServerTurnEndMessage = InferOutput<
	typeof gameServerTurnEndMessageSchema
>;

export const gameClientSubmissionMessageSchema = object({
	submission: submitSchema,
	type: literal("SUBMIT"),
});
export type GameClientSubmissionMessage = InferOutput<
	typeof gameClientSubmissionMessageSchema
>;

export const gameServerSubmissionMessageSchema = variant("type", [
	gameServerRoundStartMessageSchema,
	gameServerTurnStartMessageSchema,
	gameServerTurnEndMessageSchema,
]);

export type GameServerSubmissionMessage = InferOutput<
	typeof gameServerSubmissionMessageSchema
>;

// 投票
export const gameServerVoteMessageSchema = object({
	...gameBaseSchema.entries,
	type: literal("VOTE_START"),
});
export type GameServerVoteMessage = InferOutput<
	typeof gameServerVoteMessageSchema
>;
export const gameClientVoteMessageSchema = object({
	type: literal("VOTE"),
	votePlayerId: playerIdSchema,
});
export type GameClientVoteMessage = InferOutput<
	typeof gameClientVoteMessageSchema
>;

// クライアントメッセージ（統合）
export const gameClientMessageSchema = variant("type", [
	gameClientSubmissionMessageSchema,
	gameClientVoteMessageSchema,
]);
export type GameClientMessage = InferOutput<typeof gameClientMessageSchema>;

// 結果
export const gameServerResultMessageSchema = object({
	...gameBaseSchema.entries,
	game: object({
		...gameBaseSchema.entries.game.entries,
		winnerPlayerIds: array(playerIdSchema),
	}),
	type: literal("RESULT"),
});
export type GameServerResultMessage = InferOutput<
	typeof gameServerResultMessageSchema
>;

// ゲーム終了
export const gameServerGameEndMessageSchema = object({
	type: literal("END"),
});
export type GameServerGameEndMessage = InferOutput<
	typeof gameServerGameEndMessageSchema
>;

// 全体
export const gameServerMessageSchema = variant("type", [
	gameServerSubmissionMessageSchema,
	gameServerVoteMessageSchema,
	gameServerResultMessageSchema,
	gameServerGameEndMessageSchema,
]);
export type GameServerMessage = InferOutput<typeof gameServerMessageSchema>;

export const gameResultRequestParamSchema = object({
	gameId: gameIdSchema,
});
export type GameResultRequestParam = InferOutput<
	typeof gameResultRequestParamSchema
>;

export const gameResultResponseBodySchema = object({
	rounds: array(
		object({
			players: array(
				object({
					image: userSchema.entries.image,
					isWinner: boolean(),
					...pick(playerSchema, ["id", "playerName"]).entries,
					submission: string(),
					userId: nullable(playerSchema.entries.userId),
				}),
			),
			roundNo: roundSchema.entries.roundNo,
			theme: roundThemeSchema.entries.text,
		}),
	),
	title: gameSchema.entries.title,
	winners: array(
		object({
			...pick(playerSchema, ["id", "playerName"]).entries,
			image: userSchema.entries.image,
			userId: nullable(playerSchema.entries.userId),
			winCount: number(),
		}),
	),
});
export type GameResultResponseBody = InferOutput<
	typeof gameResultResponseBodySchema
>;
