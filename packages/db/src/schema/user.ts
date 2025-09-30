import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import { type InferOutput, omit } from "valibot";

export const userStatusEnum = pgEnum("user_status", ["active", "deactivated"]);

export const userTable = pgTable("user", {
	createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
	email: text().unique().notNull(),
	id: uuid().primaryKey().defaultRandom(),
	image: text(),
	name: text().notNull(),
	status: userStatusEnum().notNull().default("active"),
	sub: text().unique().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
});

// model
export const userSchema = omit(createSelectSchema(userTable), [
	"createdAt",
	"updatedAt",
]);

export type User = InferOutput<typeof userSchema>;
