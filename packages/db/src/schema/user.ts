import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-valibot";
import * as v from "valibot";

// TODO: スキーマ整備
export const userTable = pgTable("user", {
  id: uuid().primaryKey().defaultRandom(),
  sub: text().unique().notNull(),
  email: text().unique().notNull(),
  name: text().notNull(),
  avatarUrl: text(),
  isActive: boolean().default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
