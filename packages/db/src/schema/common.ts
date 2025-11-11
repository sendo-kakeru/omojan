import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

const timestampMsDefault = sql`(strftime('%s', 'now') * 1000)`;
const randomUuid = sql`
        lower(hex(randomblob(4)))
        || '-' || lower(hex(randomblob(2)))
        || '-' || '4' || substr(lower(hex(randomblob(2))), 2)
        || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2)
        || '-' || lower(hex(randomblob(6)))
`;

export const tableBaseColumns = {
        createdAt: integer("created_at", { mode: "timestamp_ms" })
                .notNull()
                .default(timestampMsDefault),
        id: text("id")
                .notNull()
                .primaryKey()
                .default(randomUuid),
        updatedAt: integer("updated_at", { mode: "timestamp_ms" })
                .notNull()
                .default(timestampMsDefault),
};
