import { customType, text } from "drizzle-orm/sqlite-core";
import { uuidv7 } from "uuidv7";

const dateTime = customType<{
	data: Date;
	driverData: string;
}>({
	dataType: (): string => "text",
	fromDriver: (value: string): Date => new Date(value),
	toDriver: (value: Date): string => value.toISOString(),
});

export const tableBaseColumns = {
	createdAt: dateTime("created_at")
		.notNull()
		.$defaultFn(() => new Date()),
	id: text("id")
		.notNull()
		.primaryKey()
		.$defaultFn(() => uuidv7()),
	updatedAt: dateTime("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
};
