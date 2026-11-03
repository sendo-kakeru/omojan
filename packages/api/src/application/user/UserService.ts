import type { GetPublicUserResponseBody, PublicUser } from "@repo/db/models";
import {
	gameTable,
	playerTable,
	type User,
	type UserId,
	userTable,
} from "@repo/db/schemas";
import { and, count, eq, sql } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

export class UserService {
	constructor(private readonly db: DrizzleClient) {}

	async findById({ id }: { id: UserId }): Promise<GetPublicUserResponseBody> {
		const [findUser] = await this.db
			.select({
				id: userTable.id,
				image: userTable.image,
				name: userTable.name,
			})
			.from(userTable)
			.where(and(eq(userTable.id, id), eq(userTable.status, "active")));

		if (!findUser) return null;

		const { playCount, winCount } = await this.calculateStats({ userId: id });

		return this.convertToPublicUser({ ...findUser, playCount, winCount });
	}

	private async calculateStats({
		userId,
	}: {
		userId: UserId;
	}): Promise<{ playCount: number; winCount: number }> {
		// ユーザーが参加した終了済みゲームの数と、そのうち勝者になったゲームの数を集計
		const [stats] = await this.db
			.select({
				playCount: count(),
				winCount: sql`coalesce(sum(${playerTable.isWinner}), 0)`.mapWith(
					Number,
				),
			})
			.from(playerTable)
			.innerJoin(gameTable, eq(playerTable.gameId, gameTable.id))
			.where(
				and(eq(playerTable.userId, userId), eq(gameTable.status, "finished")),
			);

		return {
			playCount: stats?.playCount ?? 0,
			winCount: stats?.winCount ?? 0,
		};
	}

	private convertToPublicUser({
		id,
		image,
		name,
		playCount,
		winCount,
	}: Pick<User, "id" | "image" | "name"> & {
		playCount: number;
		winCount: number;
	}): PublicUser {
		return {
			image,
			name,
			playCount,
			userId: id,
			winCount,
		};
	}
}
