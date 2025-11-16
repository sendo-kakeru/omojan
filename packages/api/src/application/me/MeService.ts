import { type User, userTable } from "@repo/db/schema/user";
import { isUniqueConstraintError } from "@repo/shared/error";
import type {
	CreateMeRequestBody,
	CreateMeResponseBody,
	GetMeResponseBody,
	Me,
} from "@repo/shared/model/me";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../types";

export class MeService {
	constructor(private readonly db: DrizzleClient) {}

	async findBySub({ sub }: Pick<User, "sub">): Promise<GetMeResponseBody> {
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

	async register(
		dto: CreateMeRequestBody & Pick<User, "sub">,
	): Promise<CreateMeResponseBody> {
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
				throw new HTTPException(500, {
					message: "作成したユーザーの取得に失敗しました",
				});
			}

			return this.convertUserToMe(createdUser);
		} catch (error) {
			if (isUniqueConstraintError(error)) {
				throw new HTTPException(409, {
					message: "ユーザーは既に存在します",
				});
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
