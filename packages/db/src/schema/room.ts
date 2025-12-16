import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	literal,
	object,
	pipe,
	safeParse,
	string,
	union,
	uuid,
} from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";

export const roomIdSchema = pipe(string(), uuid(), brand("room_id"));
export type RoomId = InferOutput<typeof roomIdSchema>;

export function isRoomId(id: unknown): id is RoomId {
	const result = safeParse(roomIdSchema, id);
	return result.success;
}

export const roomTable = sqliteTable("room", {
	...tableBaseColumns,
	id: idBaseColumn.$type<RoomId>(),
	isPrivate: integer("is_private", { mode: "boolean" })
		.notNull()
		.default(false),
	password: text("password"),
	status: text("status", { enum: ["waiting", "active", "finished"] })
		.notNull()
		.default("waiting"),
	timeLimit: integer("time_limit").notNull(),
	title: text("title").notNull(),
});

export const roomSchema = createSelectSchema(roomTable, {
	id: roomIdSchema,
});
export type Room = InferOutput<typeof roomSchema>;

export const roomStateSchema = union([
	literal("waiting"),
	literal("setting"), // 不要だったら消す
	literal("submission"),
	literal("voting"),
	literal("result"),
]);
export type RoomState = InferOutput<typeof roomStateSchema>;

export const roomIdRequestParamSchema = object({ roomId: roomIdSchema });
