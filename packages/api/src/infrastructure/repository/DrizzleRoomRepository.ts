import { gameTable } from "@repo/db/schema/game";
import { playerTable } from "@repo/db/schema/player";
import { userTable } from "@repo/db/schema/user";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Room } from "../../domain/room/Room";
import { RoomPlayer } from "../../domain/room/RoomPlayer";
import type {
	AddPlayerCommand,
	CreateRoomCommand,
	RoomRepository,
} from "../../domain/room/RoomRepository";
import type { DrizzleClient } from "../../libs/drizzle";

export class DrizzleRoomRepository implements RoomRepository {
	constructor(private readonly db: DrizzleClient) {}

	async findWaitingRooms(): Promise<Room[]> {
		const games = await this.db
			.select({
				createdAt: gameTable.createdAt,
				id: gameTable.id,
				isPrivate: gameTable.isPrivate,
				password: gameTable.password,
				status: gameTable.status,
				timeLimit: gameTable.timeLimit,
				title: gameTable.title,
			})
			.from(gameTable)
			.where(eq(gameTable.status, "waiting"))
			.orderBy(desc(gameTable.createdAt));

		if (games.length === 0) {
			return [];
		}

		const players = await this.db
			.select({
				gameId: playerTable.gameId,
				id: playerTable.id,
				image: userTable.image,
				isHost: playerTable.isHost,
				playerName: playerTable.playerName,
				seat: playerTable.seat,
				userId: playerTable.userId,
			})
			.from(playerTable)
			.leftJoin(userTable, eq(playerTable.userId, userTable.id))
			.where(
				inArray(
					playerTable.gameId,
					games.map((game) => game.id),
				),
			);

		const groupedPlayers = new Map<string, RoomPlayer[]>();

		for (const player of players) {
			const domainPlayer = new RoomPlayer({
				id: player.id,
				image: player.image,
				isHost: player.isHost,
				playerName: player.playerName,
				seat: player.seat,
				userId: player.userId,
			});

			const list = groupedPlayers.get(player.gameId) ?? [];
			list.push(domainPlayer);
			groupedPlayers.set(player.gameId, list);
		}

		return games.map(
			(game) =>
				new Room({
					id: game.id,
					isPrivate: game.isPrivate,
					password: game.password,
					players: groupedPlayers.get(game.id) ?? [],
					status: game.status,
					timeLimit: game.timeLimit,
					title: game.title,
				}),
		);
	}

	async findById(gameId: string): Promise<Room | null> {
		const [game] = await this.db
			.select({
				id: gameTable.id,
				isPrivate: gameTable.isPrivate,
				password: gameTable.password,
				status: gameTable.status,
				timeLimit: gameTable.timeLimit,
				title: gameTable.title,
			})
			.from(gameTable)
			.where(eq(gameTable.id, gameId));

		if (!game) {
			return null;
		}

		const players = await this.db
			.select({
				id: playerTable.id,
				image: userTable.image,
				isHost: playerTable.isHost,
				playerName: playerTable.playerName,
				seat: playerTable.seat,
				userId: playerTable.userId,
			})
			.from(playerTable)
			.leftJoin(userTable, eq(playerTable.userId, userTable.id))
			.where(eq(playerTable.gameId, game.id));

		return new Room({
			id: game.id,
			isPrivate: game.isPrivate,
			password: game.password,
			players: players.map(
				(player) =>
					new RoomPlayer({
						id: player.id,
						image: player.image,
						isHost: player.isHost,
						playerName: player.playerName,
						seat: player.seat,
						userId: player.userId,
					}),
			),
			status: game.status,
			timeLimit: game.timeLimit,
			title: game.title,
		});
	}

	async createRoom(command: CreateRoomCommand): Promise<{ roomId: string }> {
		return await this.db.transaction(async (tx) => {
			const [createdGame] = await tx
				.insert(gameTable)
				.values({
					isPrivate: command.isPrivate,
					password: command.password,
					timeLimit: command.timeLimit,
					title: command.title,
				})
				.returning({ id: gameTable.id });

			if (!createdGame) {
				throw new Error("作成したGameの取得に失敗しました");
			}

			await tx.insert(playerTable).values({
				gameId: createdGame.id,
				gameTokenHash: command.hostTokenHash,
				isHost: true,
				playerName: command.hostPlayerName,
				seat: 1,
				userId: command.hostUserId,
			});

			return { roomId: createdGame.id };
		});
	}

	async findPlayerIdByTokenHash(
		gameId: string,
		tokenHash: string,
	): Promise<string | null> {
		const [player] = await this.db
			.select({ id: playerTable.id })
			.from(playerTable)
			.where(
				and(
					eq(playerTable.gameId, gameId),
					eq(playerTable.gameTokenHash, tokenHash),
				),
			);

		return player?.id ?? null;
	}

	async findPlayerIdByUserId(
		gameId: string,
		userId: string,
	): Promise<string | null> {
		const [player] = await this.db
			.select({ id: playerTable.id })
			.from(playerTable)
			.where(
				and(eq(playerTable.gameId, gameId), eq(playerTable.userId, userId)),
			);

		return player?.id ?? null;
	}

	async updatePlayerTokenHash(
		playerId: string,
		tokenHash: string,
	): Promise<void> {
		await this.db
			.update(playerTable)
			.set({ gameTokenHash: tokenHash })
			.where(eq(playerTable.id, playerId));
	}

	async addPlayer(command: AddPlayerCommand): Promise<void> {
		await this.db.insert(playerTable).values({
			gameId: command.gameId,
			gameTokenHash: command.tokenHash,
			isHost: command.player.isHost,
			playerName: command.player.playerName,
			seat: command.player.seat,
			userId: command.player.userId,
		});
	}
}
