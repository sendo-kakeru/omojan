import { type Game, gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { type User, userTable } from "@repo/db/schema/user";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import type { InferOutput } from "valibot";
import type { DrizzleClient } from "../../libs/drizzle";

const insertGameSchema = createInsertSchema(gameTable);
type InsertGameArgs = InferOutput<typeof insertGameSchema>;

const insertPlayer = createInsertSchema(playerTable);
type InsertPlayer = InferOutput<typeof insertPlayer>;

export class GameService {
	constructor(private readonly db: DrizzleClient) {}

	async create({
		sub,
		game,
		player,
	}: {
		sub: User["sub"] | null;
		game: Pick<
			InsertGameArgs,
			"isPrivate" | "password" | "title" | "timeLimit"
		>;
		player: Pick<InsertPlayer, "playerName">;
	}): Promise<Pick<Game, "id">> {
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
				.values(game)
				.returning({ id: gameTable.id });

			if (!createdGame) {
				throw new Error("作成したGameの取得に失敗しました");
			}

			await tx.insert(playerTable).values({
				...player,
				gameId: createdGame.id,
				isHost: true,
				seat: 1,
				userId: authUser?.id ?? null,
			});

			return createdGame;
		});
	}
}
