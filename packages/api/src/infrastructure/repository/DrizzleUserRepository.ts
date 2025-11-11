import { userTable } from "@repo/db/schema/user";
import { eq } from "drizzle-orm";
import type { UserRepository } from "../../domain/user/UserRepository";
import type { DrizzleClient } from "../../libs/drizzle";

export class DrizzleUserRepository implements UserRepository {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub(sub: string) {
		const [user] = await this.db
			.select({ id: userTable.id })
			.from(userTable)
			.where(eq(userTable.sub, sub));

		return user ?? null;
	}
}
