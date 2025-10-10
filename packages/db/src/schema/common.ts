import { timestamp, uuid } from "drizzle-orm/pg-core";

export const tableBaseColumns = {
	createdAt: timestamp({ mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
	id: uuid().primaryKey().defaultRandom(),
	updatedAt: timestamp({ mode: "date", withTimezone: true })
		.notNull()
		.defaultNow(),
};
