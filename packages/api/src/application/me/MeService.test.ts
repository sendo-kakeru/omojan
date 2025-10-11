import { MOCK_USER } from "@repo/mock/model";
import { describe, expect, test, vi } from "vitest";
import type { UserRepository } from "../../infrastructure/user/UserRepository";
import { MeService, type RegisterMeServiceArgs } from "./MeService";

describe("MeService", () => {
	const mockUserRepository = {
		create: vi.fn(),
		findBySub: vi.fn(),
	};

	const meService = new MeService(
		mockUserRepository as unknown as UserRepository,
	);

	describe("findBySub", () => {
		test("ユーザーが存在する場合、Meオブジェクトを返す", async () => {
			mockUserRepository.findBySub.mockResolvedValueOnce(MOCK_USER);

			const result = await meService.findBySub(MOCK_USER.sub);

			expect(result).toEqual({
				email: MOCK_USER.email,
				image: MOCK_USER.image,
				name: MOCK_USER.name,
				userId: MOCK_USER.id,
			});
			expect(mockUserRepository.findBySub).toHaveBeenCalledWith(MOCK_USER.sub);
		});

		test("ユーザーが存在しない場合、nullを返す", async () => {
			mockUserRepository.findBySub.mockResolvedValueOnce(null);

			const result = await meService.findBySub(MOCK_USER.sub);

			expect(result).toBeNull();
			expect(mockUserRepository.findBySub).toHaveBeenCalledWith(MOCK_USER.sub);
		});
	});

	describe("register", () => {
		const REGISTER_ME_INPUT: RegisterMeServiceArgs = {
			email: MOCK_USER.email,
			image: MOCK_USER.image,
			name: MOCK_USER.name,
			sub: MOCK_USER.sub,
		};

		test("新規ユーザーを登録してMeオブジェクトを返す", async () => {
			mockUserRepository.create.mockResolvedValueOnce(MOCK_USER);

			const result = await meService.register(REGISTER_ME_INPUT);

			expect(result).toEqual({
				email: MOCK_USER.email,
				image: MOCK_USER.image,
				name: MOCK_USER.name,
				userId: MOCK_USER.id,
			});
			expect(mockUserRepository.create).toHaveBeenCalledWith(REGISTER_ME_INPUT);
		});
	});
});
