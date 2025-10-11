import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";

export const userStatusEnum = pgEnum("user_status", ["active", "deactivated"]);

export const userTable = pgTable("user", {
	...tableBaseColumns,
	email: text().unique().notNull(),
	image: text(),
	name: text().notNull(),
	status: userStatusEnum().notNull().default("active"),
	sub: text().unique().notNull(),
});

export const userSchema = createSelectSchema(userTable);

export type User = InferOutput<typeof userSchema>;
