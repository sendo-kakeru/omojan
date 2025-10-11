import { type User, userTable } from "@repo/db/schema/user";
import { UniqueKeyAlreadyExistsError } from "@repo/shared/error";
import type { CreateMeRequestBody, Me } from "@repo/shared/model/me";
import { hasCode } from "@repo/shared/utils";
import { DrizzleQueryError, eq } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

export class MeService {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub({ sub }: Pick<User, "sub">): Promise<Me | null> {
		const [findUser] = await this.db
			.select({
				email: userTable.email,
				id: userTable.id,
				image: userTable.image,
				name: userTable.name,
			})
			.from(userTable)
			.where(eq(userTable.sub, sub));
		return findUser ? this.convertUserToMe(findUser) : null;
	}

	async register(dto: CreateMeRequestBody & Pick<User, "sub">): Promise<Me> {
		try {
			const [createdUser] = await this.db
				.insert(userTable)
				.values(dto)
				.returning({
					email: userTable.email,
					id: userTable.id,
					image: userTable.image,
					name: userTable.name,
				});

			if (!createdUser) {
				throw new Error("作成したユーザーの取得に失敗しました");
			}

			return this.convertUserToMe(createdUser);
		} catch (error) {
			if (
				error instanceof DrizzleQueryError &&
				hasCode(error.cause) &&
				error.cause.code === "23505"
			) {
				throw new UniqueKeyAlreadyExistsError();
			}
			throw error;
		}
	}

	private convertUserToMe(
		user: Pick<User, "id" | "email" | "name" | "image">,
	): Me {
		return {
			email: user.email,
			image: user.image,
			name: user.name,
			userId: user.id,
		};
	}
}
