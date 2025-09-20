import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import * as v from "valibot";

// TODO: スキーマ整備
export const userTable = pgTable("user", {
	avatarUrl: text(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	email: text().unique().notNull(),
	id: uuid().primaryKey().defaultRandom(),
	isActive: boolean().default(true).notNull(),
	name: text().notNull(),
	sub: text().unique().notNull(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

// model
export const userSchema = v.omit(createSelectSchema(userTable), [
	"createdAt",
	"updatedAt",
]);

export type User = v.InferOutput<typeof userSchema>;
