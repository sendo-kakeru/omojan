import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";

export const userTable = sqliteTable("user", {
        ...tableBaseColumns,
        email: text("email").notNull().unique(),
        image: text("image"),
        name: text("name").notNull(),
        status: text("status", { enum: ["active", "deactivated"] })
                .notNull()
                .default("active"),
        sub: text("sub").notNull().unique(),
});

export const userSchema = createSelectSchema(userTable);

export type User = InferOutput<typeof userSchema>;
