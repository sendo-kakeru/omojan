import { type User, userTable } from "@repo/db/schema/user";
import type { Me } from "@repo/shared/domain/me";
import { createInsertSchema } from "drizzle-valibot";
import { type InferOutput, pick } from "valibot";
import type { UserRepository } from "../../infrastructure/user/UserRepository";

type FindMeBySubServiceArgs = User["sub"];

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
	constructor(private readonly userRepository: UserRepository) {}

	async findBySub(sub: FindMeBySubServiceArgs): Promise<Me | null> {
		const findUser = await this.userRepository.findBySub(sub);
		return findUser ? this.convertUserToMe(findUser) : null;
	}

	async register(user: RegisterMeServiceArgs): Promise<Me> {
		const createdUser = await this.userRepository.create(user);
		return this.convertUserToMe(createdUser);
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
