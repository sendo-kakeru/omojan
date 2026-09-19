import type {
	CreateMeRequestBody,
	CreateMeResponseBody,
	Me,
	UpdateMeRequestBody,
	UpdateMeResponseBody,
} from "@repo/db/model";
import { type User, type UserId, userTable } from "@repo/db/schema";
import { isUniqueConstraintError } from "@repo/shared/error";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

const meColumns = {
	email: userTable.email,
	image: userTable.image,
	name: userTable.name,
	userId: userTable.id,
} as const;

export class MeService {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub({
		sub,
	}: Pick<User, "sub">): Promise<{ me: Me; status: User["status"] } | null> {
		const [findUser] = await this.db
			.select({ ...meColumns, status: userTable.status })
			.from(userTable)
			.where(eq(userTable.sub, sub))
			.limit(1);

		if (!findUser) return null;

		const { status, ...me } = findUser;
		return { me, status };
	}

	async register(
		dto: CreateMeRequestBody & Pick<User, "sub">,
	): Promise<CreateMeResponseBody> {
		try {
			const [createdUser] = await this.db
				.insert(userTable)
				.values(dto)
				.returning(meColumns);

			if (!createdUser) {
				throw new HTTPException(500, {
					message: "作成したユーザーの取得に失敗しました",
				});
			}

			return createdUser;
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw new HTTPException(409, {
					message: "ユーザーは既に存在します",
				});
			}
			throw error;
		}
	}

	async update({
		userId,
		...setValues
	}: UpdateMeRequestBody & { userId: UserId }): Promise<UpdateMeResponseBody> {
		const [updatedUser] = await this.db
			.update(userTable)
			.set(setValues)
			.where(eq(userTable.id, userId))
			.returning(meColumns);

		if (!updatedUser) {
			throw new HTTPException(404, {
				message: "ユーザーが存在しません",
			});
		}

		return updatedUser;
	}
}
