import { type InferOutput, literal, object } from "valibot";

/**
 * ハートビート用メッセージスキーマ
 */

/**
 * サーバーからクライアントへのPINGメッセージ
 */
export const heartbeatPingMessageSchema = object({
	type: literal("PING"),
});

export type HeartbeatPingMessage = InferOutput<
	typeof heartbeatPingMessageSchema
>;

/**
 * クライアントからサーバーへのPONGメッセージ
 */
export const heartbeatPongMessageSchema = object({
	type: literal("PONG"),
});

export type HeartbeatPongMessage = InferOutput<
	typeof heartbeatPongMessageSchema
>;
