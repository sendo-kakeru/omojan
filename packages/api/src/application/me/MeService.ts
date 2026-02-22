import type {
	CreateMeRequestBody,
	CreateMeResponseBody,
	GetMeResponseBody,
	Me,
	UpdateMeRequestBody,
	UpdateMeResponseBody,
} from "@repo/db/model";
import { type User, type UserId, userTable } from "@repo/db/schema";
import { isUniqueConstraintError } from "@repo/shared/error";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

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

	async getImageKey({ sub }: Pick<User, "sub">): Promise<string | null> {
		const [user] = await this.db
			.select({ image: userTable.image })
			.from(userTable)
			.where(eq(userTable.sub, sub))
			.limit(1);
		return user?.image ?? null;
	}

	async update(
		dto: UpdateMeRequestBody & Pick<User, "sub">,
	): Promise<UpdateMeResponseBody> {
		const { sub, ...setValues } = dto;

		const [updatedUser] = await this.db
			.update(userTable)
			.set(setValues)
			.where(eq(userTable.sub, sub))
			.returning({
				email: userTable.email,
				id: userTable.id,
				image: userTable.image,
				name: userTable.name,
			});

		if (!updatedUser) {
			throw new HTTPException(404, {
				message: "ユーザーが存在しません",
			});
		}

		return this.convertUserToMe(updatedUser);
	}

	private convertUserToMe(
		user: Pick<User, "email" | "name" | "image"> & { id: UserId },
	): Me {
		return {
			email: user.email,
			image: user.image,
			name: user.name,
			userId: user.id,
		};
	}
}
