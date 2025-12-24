import {
	array,
	type InferOutput,
	literal,
	nullable,
	object,
	pick,
	variant,
} from "valibot";
import {
	playerIdSchema,
	playerNameSchema,
	playerSchema,
	userSchema,
} from "../schema";
import {
	heartbeatPingMessageSchema,
	heartbeatPongMessageSchema,
} from "./heartbeat";

/**
 * クライアントからサーバーへのメッセージ
 */

export const matchingClientExitMessageSchema = object({
	/**
	 * プレイヤーが明示的に退出する
	 */
	type: literal("EXIT"),
});

export const matchingClientStartMessageSchema = object({
	/**
	 * 募集中に不足人数をCPで埋めて開始する
	 */
	type: literal("START"),
});

/**
 * マッチング用WebSocketメッセージのスキーマ
 */
export const matchingClientMessageSchema = variant("type", [
	matchingClientExitMessageSchema,
	matchingClientStartMessageSchema,
	heartbeatPongMessageSchema,
]);

export type MatchingClientMessage = InferOutput<
	typeof matchingClientMessageSchema
>;

/**
 * サーバーからクライアントへのメッセージ
 */

/**
 * マッチング参加者の情報
 */
export const matchingParticipantSchema = object({
	id: playerIdSchema,
	image: nullable(userSchema.entries.image),
	playerName: playerNameSchema,
});

export type MatchingParticipant = InferOutput<typeof matchingParticipantSchema>;

/**
 * 参加者一覧メッセージ
 */
export const matchingServerParticipantsMessageSchema = object({
	participants: array(matchingParticipantSchema),
	type: literal("PARTICIPANTS"),
});

export const matchingServerMePlayerMessageSchema = object({
	player: pick(playerSchema, ["id", "isHost"]),
	type: literal("ME_PLAYER"),
});

export type MatchingServerParticipantsMessage = InferOutput<
	typeof matchingServerParticipantsMessageSchema
>;
export type MatchingServerMePlayerMessage = InferOutput<
	typeof matchingServerMePlayerMessageSchema
>;

/**
 * サーバーからクライアントへのメッセージ
 */
export const matchingServerMessageSchema = variant("type", [
	matchingServerMePlayerMessageSchema,
	matchingServerParticipantsMessageSchema,
	heartbeatPingMessageSchema,
]);

export type MatchingServerMessage = InferOutput<
	typeof matchingServerMessageSchema
>;
