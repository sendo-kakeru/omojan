import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import { brand, type InferOutput, pipe, string, uuid } from "valibot";
import { idBaseColumn, tableBaseColumns } from "./common";

export const userIdSchema = pipe(string(), uuid(), brand("user_id"));
export type UserId = InferOutput<typeof userIdSchema>;

export const userTable = sqliteTable("user", {
	...tableBaseColumns,
	email: text("email").notNull().unique(),
	id: idBaseColumn.$type<UserId>(),
	image: text("image"),
	name: text("name").notNull(),
	status: text("status", { enum: ["active", "deactivated"] })
		.notNull()
		.default("active"),
	sub: text("sub").notNull().unique(),
});

export const userSchema = createSelectSchema(userTable, {
	id: userIdSchema,
});

export type User = InferOutput<typeof userSchema>;
