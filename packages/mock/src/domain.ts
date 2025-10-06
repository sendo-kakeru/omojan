import { faker } from "@faker-js/faker";
import type { Me } from "@repo/db/schema/me";
import type { User } from "@repo/db/schema/user";

export const MOCK_USER: User = {
	email: faker.internet.email(),
	id: faker.string.uuid(),
	image: faker.image.avatar(),
	name: faker.person.fullName(),
	status: "active",
	sub: faker.string.uuid(),
};

export const MOCK_ME: Me = {
	email: MOCK_USER.email,
	image: MOCK_USER.image,
	name: MOCK_USER.name,
	userId: MOCK_USER.id,
};
