import { gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { type User, userTable } from "@repo/db/schema/user";
import type {
	CreateRoomRequestBody,
	CreateRoomResponseBody,
} from "@repo/shared/model/room";
import { eq } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

export class RoomService {
	constructor(private readonly db: DrizzleClient) {}
	async create({
		sub,
		...dto
	}: CreateRoomRequestBody & {
		sub: User["sub"] | null;
	}): Promise<CreateRoomResponseBody> {
		return await this.db.transaction(async (tx) => {
			const authUser = await (async () => {
				if (!sub) return null;

				const [findUser] = await tx
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.sub, sub));

				return findUser;
			})();

			const [createdGame] = await tx
				.insert(gameTable)
				.values({
					isPrivate: dto.isPrivate,
					password: dto.password,
					timeLimit: dto.timeLimit,
					title: dto.title,
				})
				.returning({ id: gameTable.id });

			if (!createdGame) {
				throw new Error("作成したGameの取得に失敗しました");
			}

			await tx.insert(playerTable).values({
				gameId: createdGame.id,
				isHost: true,
				playerName: dto.playerName,
				seat: 1,
				userId: authUser?.id ?? null,
			});

			return { gameId: createdGame.id };
		});
	}
}
