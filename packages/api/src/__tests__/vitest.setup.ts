import * as schema from "@repo/db/schema";
import { reset } from "drizzle-seed";
import { createTestDbClient } from "./createTestDbClient";

export default async function () {
	const db = createTestDbClient();
	await reset(db, schema);
}
