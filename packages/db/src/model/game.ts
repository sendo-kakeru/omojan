import {
	array,
	boolean,
	type InferOutput,
	literal,
	nullable,
	number,
	object,
	pick,
	union,
	null as valibotNull,
	variant,
} from "valibot";
import {
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
	literal("WAITING"),
	literal("TURN_START_PENDING"),
	literal("SUBMISSION"),
	literal("VOTING"),
	literal("RESULT"),
]);
export type GameState = InferOutput<typeof gameStateSchema>;

const gamePlayerCardSchema = object({
	...pick(playerCardSchema, ["id", "text"]).entries,
	used: boolean(),
});
export type GamePlayerCard = InferOutput<typeof gamePlayerCardSchema>;

export const gameBaseSchema = object({
	game: object({
		...pick(gameSchema, ["timeLimit"]).entries,
		...pick(roundSchema, ["roundNo"]).entries,
		players: array(
			object({
				...pick(playerSchema, ["id", "playerName", "seat"]).entries,
				...pick(userSchema, ["image"]).entries,
				submittedText: playerCardSchema.entries.text,
				winCount: number(),
			}),
		),
		theme: roundThemeSchema.entries.text,
	}),
	mePlayer: object({
		id: playerIdSchema,
		playerCards: array(gamePlayerCardSchema),
	}),
});
const gameSubmissionBaseSchema = object({
	...gameBaseSchema.entries,
	game: object({
		...gameBaseSchema.entries.game.entries,
		players: array(
			object({
				...gameBaseSchema.entries.game.entries.players.item.entries,
				submittedText: nullable(playerCardSchema.entries.text),
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
