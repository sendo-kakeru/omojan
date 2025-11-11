import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

const timestampMsDefault = sql`(strftime('%s', 'now') * 1000)`;
export const tableBaseColumns = {
        createdAt: integer("created_at", { mode: "timestamp_ms" })
                .notNull()
                .default(timestampMsDefault),
        id: text("id")
                .notNull()
                .primaryKey()
                .default(sql`cuid2()`),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
                .notNull()
                .default(timestampMsDefault),
};
