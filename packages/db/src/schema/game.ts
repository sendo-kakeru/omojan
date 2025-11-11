import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import { tableBaseColumns } from "./common";

export const gameTable = sqliteTable("game", {
        ...tableBaseColumns,
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

export const gameSchema = createSelectSchema(gameTable);
export type Game = InferOutput<typeof gameSchema>;
