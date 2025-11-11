import { type User, userTable } from "@repo/db/schema/user";
import type {
	CreateMeRequestBody,
	CreateMeResponseBody,
	GetMeResponseBody,
	Me,
} from "@repo/shared/model/me";
import { hasCode } from "@repo/shared/utils";
import { DrizzleQueryError, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

const SQLITE_UNIQUE_ERROR_PREFIX = "SQLITE_CONSTRAINT";

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
				.values({
					...dto,
					id: crypto.randomUUID(),
				})
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
			if (
				error instanceof DrizzleQueryError &&
				hasCode(error.cause) &&
				typeof error.cause.code === "string" &&
				error.cause.code.startsWith(SQLITE_UNIQUE_ERROR_PREFIX)
			) {
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
