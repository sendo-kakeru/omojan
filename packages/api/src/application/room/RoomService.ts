import { gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { type User, userTable } from "@repo/db/schema/user";
import type {
	CreateRoomRequestBody,
	CreateRoomResponseBody,
	GetRoomListResponseBody,
} from "@repo/shared/model/room";
import { desc, eq, inArray } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";

export class RoomService {
	constructor(private readonly db: DrizzleClient) {}

	/**
	 * 募集中のルーム一覧を取得する
	 */
	async findMany(): Promise<GetRoomListResponseBody> {
		return await this.db.transaction(async (tx) => {
			const games = await tx
				.select({
					createdAt: gameTable.createdAt,
					id: gameTable.id,
					isPrivate: gameTable.isPrivate,
					timeLimit: gameTable.timeLimit,
					title: gameTable.title,
				})
				.from(gameTable)
				.where(eq(gameTable.status, "waiting"))
				.orderBy(desc(gameTable.createdAt));

			if (games.length === 0) return [];

			const players = await tx
				.select({
					gameId: playerTable.gameId,
					id: playerTable.id,
					image: userTable.image,
					isHost: playerTable.isHost,
					playerName: playerTable.playerName,
					seat: playerTable.seat,
				})
				.from(playerTable)
				.leftJoin(userTable, eq(playerTable.userId, userTable.id))
				.where(
					inArray(
						playerTable.gameId,
						games.map((game) => game.id),
					),
				);

			const groupedPlayersByGameId = new Map<string, typeof players>();

			for (const player of players) {
				const arr = groupedPlayersByGameId.get(player.gameId) ?? [];
				arr.push(player);
				groupedPlayersByGameId.set(player.gameId, arr);
			}

			return games.map((game) => ({
				gameId: game.id,
				isPrivate: game.isPrivate,
				players: (groupedPlayersByGameId.get(game.id) ?? [])
					.sort((a, b) => a.seat - b.seat)
					.map((player) => ({
						id: player.id,
						image: player.image,
						isHost: player.isHost,
						playerName: player.playerName,
						seat: player.seat,
					})),
				timeLimit: game.timeLimit,
				title: game.title,
			}));
		});
	}
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
					password: dto.isPrivate ? this.generateRoomPassword() : null,
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
	private generateRoomPassword(length = 6): string {
		// NOTE: 身内以外が参加してほしくないだけなのでユーザーが入力する面倒を減らすため、一旦小文字英数字のみ。
		// ハッシュ化や厳密なランダムもしない
		const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
		// const CHARACTERS =
		// 	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let password = "";
		for (let i = 0; i < length; i++) {
			password += CHARACTERS.charAt(
				Math.floor(Math.random() * CHARACTERS.length),
			);
		}
		return password;
	}
}
