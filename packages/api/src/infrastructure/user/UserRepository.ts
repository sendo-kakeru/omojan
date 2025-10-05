import { type User, userTable } from "@repo/db/schema/user";
import { UniqueKeyAlreadyExistsError } from "@repo/shared/error";
import { hasCode } from "@repo/shared/utils";
import { DrizzleQueryError, eq, getTableColumns } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { type InferOutput, pick } from "valibot";
import type { DrizzleClient } from "../../libs/drizzle";

type FindUserBySubRepositoryArgs = User["sub"];

const createUserRepositoryArgsSchema = pick(createInsertSchema(userTable), [
	"sub",
	"email",
	"name",
	"image",
]);
type CreateUserRepositoryArgs = InferOutput<
	typeof createUserRepositoryArgsSchema
>;

export class UserRepository {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub(sub: FindUserBySubRepositoryArgs): Promise<User | null> {
		const [findUser] = await this.db
			.select(
				(({ createdAt, updatedAt, ...rest }) => rest)(
					getTableColumns(userTable),
				),
			)
			.from(userTable)
			.where(eq(userTable.sub, sub));
		return findUser ?? null;
	}

	async create(user: CreateUserRepositoryArgs): Promise<User> {
		try {
			const [createdUser] = await this.db
				.insert(userTable)
				.values(user)
				.returning(
					(({ createdAt, updatedAt, ...rest }) => rest)(
						getTableColumns(userTable),
					),
				);

			if (!createdUser) {
				throw new Error("作成したユーザーの取得に失敗しました");
			}

			return createdUser;
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
}
