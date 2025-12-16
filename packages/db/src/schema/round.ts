import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	literal,
	pipe,
	string,
	union,
	uuid,
} from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";
import { type RoomId, roomIdSchema, roomTable } from "./room";

export const roundIdSchema = pipe(string(), uuid(), brand("round_id"));
export type RoundId = InferOutput<typeof roundIdSchema>;

export const roundNoSchema = union([
	literal(1),
	literal(2),
	literal(3),
	literal(4),
]);
export type RoundNo = InferOutput<typeof roundNoSchema>;

export const roundTable = sqliteTable("round", {
	...tableBaseColumns,
	id: idBaseColumn.$type<RoundId>(),
	roomId: text("room_id")
		.notNull()
		.$type<RoomId>()
		.references(() => roomTable.id, { onDelete: "cascade" }),
	roundNo: integer("round_no").notNull().$type<RoundNo>(),
	status: text("status", { enum: ["submitting", "voting", "closed"] })
		.notNull()
		.default("submitting"),
});

export const roundSchema = createSelectSchema(roundTable, {
	id: roundIdSchema,
	roomId: roomIdSchema,
	roundNo: roundNoSchema,
});
export type Round = InferOutput<typeof roundSchema>;
