import { faker } from "@faker-js/faker";
import { userTable } from "@repo/db/schema/user";
import { MOCK_USER } from "@repo/mock/model";
import { UniqueKeyAlreadyExistsError } from "@repo/shared/error";
import { drizzle } from "drizzle-orm/node-postgres";
import { beforeEach, describe, expect, test } from "vitest";
import {
	type CreateUserRepositoryArgs,
	UserRepository,
} from "./UserRepository";

describe("UserRepository", () => {
	const db = drizzle(process.env.DATABASE_URL, { casing: "snake_case" });
	const userRepository = new UserRepository(db);

	beforeEach(async () => {
		await db.delete(userTable);
	});

	describe("findBySub", () => {
		test("subに一致するユーザーを返す", async () => {
			const [insertedUser] = await db
				.insert(userTable)
				.values(MOCK_USER)
				.returning();

			const result = await userRepository.findBySub(MOCK_USER.sub);

			expect(result).toBeDefined();
			expect(result?.sub).toBe(MOCK_USER.sub);
			expect(result?.email).toBe(MOCK_USER.email);
			expect(result?.name).toBe(MOCK_USER.name);
			expect(result?.image).toBe(MOCK_USER.image);
			expect(result?.id).toBe(insertedUser?.id);
		});

		test("ユーザーが存在しない場合nullを返す", async () => {
			const NON_EXISTENT_SUB = faker.string.uuid();

			const result = await userRepository.findBySub(NON_EXISTENT_SUB);

			expect(result).toBeNull();
		});
	});

	describe("create", () => {
		const CREATE_USER_INPUT: CreateUserRepositoryArgs = {
			email: MOCK_USER.email,
			image: MOCK_USER.image,
			name: MOCK_USER.name,
			sub: MOCK_USER.sub,
		};
		test("新規ユーザーを作成して返す", async () => {
			const result = await userRepository.create(CREATE_USER_INPUT);

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.sub).toBe(CREATE_USER_INPUT.sub);
			expect(result.email).toBe(CREATE_USER_INPUT.email);
			expect(result.name).toBe(CREATE_USER_INPUT.name);
			expect(result.image).toBe(CREATE_USER_INPUT.image);
			expect(result.status).toBe("active");

			const foundUser = await userRepository.findBySub(CREATE_USER_INPUT.sub);
			expect(foundUser).toBeDefined();
			expect(foundUser?.id).toBe(result.id);
		});

		test("Emailが重複した場合、UniqueKeyAlreadyExistsErrorをスロー", async () => {
			await userRepository.create(CREATE_USER_INPUT);

			await expect(
				userRepository.create({
					...CREATE_USER_INPUT,
					sub: faker.string.uuid(),
				}),
			).rejects.toThrow(UniqueKeyAlreadyExistsError);
		});

		test("imageはnullでも作成できる", async () => {
			const result = await userRepository.create({
				...CREATE_USER_INPUT,
				image: null,
			});

			expect(result).toBeDefined();
			expect(result.image).toBeNull();
			expect(result.sub).toBe(CREATE_USER_INPUT.sub);
		});
	});
});
