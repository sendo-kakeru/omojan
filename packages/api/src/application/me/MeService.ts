import type { Me } from "@repo/db/schema/me";
import { type User, userTable } from "@repo/db/schema/user";
import { UniqueKeyAlreadyExistsError } from "@repo/shared/error";
import { hasCode } from "@repo/shared/utils";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { type InferOutput, pick } from "valibot";
import type { DrizzleClient } from "../../libs/drizzle";

const registerMeServiceArgsSchema = pick(createInsertSchema(userTable), [
	"sub",
	"email",
	"name",
	"image",
]);
export type RegisterMeServiceArgs = InferOutput<
	typeof registerMeServiceArgsSchema
>;

export class MeService {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub(sub: User["sub"]): Promise<Me | null> {
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

	async register(user: RegisterMeServiceArgs): Promise<Me> {
		try {
			const [createdUser] = await this.db
				.insert(userTable)
				.values(user)
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
