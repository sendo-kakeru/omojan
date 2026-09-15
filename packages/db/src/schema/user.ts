import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import {
	brand,
	type InferOutput,
	maxLength,
	minLength,
	nullable,
	pipe,
	string,
	trim,
	uuid,
} from "valibot";
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

export const userNameSchema = pipe(
	string(),
	trim(),
	minLength(1, "名前を入力してください"),
	maxLength(50, "名前は50文字以下で入力してください"),
);

export const userSchema = createSelectSchema(userTable, {
	id: userIdSchema,
	image: nullable(string()),
});

export type User = InferOutput<typeof userSchema>;
