import {
	array,
	type InferOutput,
	literal,
	nullable,
	object,
	variant,
} from "valibot";
import { playerIdSchema, playerNameSchema, userSchema } from "../schema";
import {
	heartbeatPingMessageSchema,
	heartbeatPongMessageSchema,
} from "./heartbeat";

/**
 * クライアントからサーバーへのメッセージ
 */

export const matchingClientLeaveMessageSchema = object({
	/**
	 * プレイヤーが明示的に退出する
	 */
	type: literal("LEAVE"),
});

/**
 * マッチング用WebSocketメッセージのスキーマ
 */
export const matchingClientMessageSchema = variant("type", [
	matchingClientLeaveMessageSchema,
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

export type MatchingServerParticipantsMessage = InferOutput<
	typeof matchingServerParticipantsMessageSchema
>;

/**
 * サーバーからクライアントへのメッセージ
 */
export const matchingServerMessageSchema = variant("type", [
	matchingServerParticipantsMessageSchema,
	heartbeatPingMessageSchema,
]);

export type MatchingServerMessage = InferOutput<
	typeof matchingServerMessageSchema
>;
