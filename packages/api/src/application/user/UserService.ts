import type { GetPublicUserResponseBody, PublicUser } from "@repo/db/model";
import { type User, type UserId, userTable } from "@repo/db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

export class UserService {
	constructor(private readonly db: DrizzleClient) {}

	async findById({ id }: { id: UserId }): Promise<GetPublicUserResponseBody> {
		const [findUser] = await this.db
			.select({
				id: userTable.id,
				image: userTable.image,
				name: userTable.name,
			})
			.from(userTable)
			.where(eq(userTable.id, id));
		return findUser ? this.convertToPublicUser(findUser) : null;
	}

	private convertToPublicUser(
		user: Pick<User, "id" | "image" | "name">,
	): PublicUser {
		return {
			image: user.image,
			name: user.name,
			userId: user.id,
		};
	}
}
