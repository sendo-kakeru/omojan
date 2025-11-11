import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { encodeBase64urlNoPadding } from "@oslojs/encoding";
import { gameTable } from "@repo/db/schema/game";
import { isPlayerSeat, playerTable } from "@repo/db/schema/player";
import { type User, userTable } from "@repo/db/schema/user";
import type {
	CreateRoomRequestBody,
	CreateRoomResponseBody,
	GetRoomListResponseBody,
	JoinRoomRequestBody,
	JoinRoomResponseBody,
} from "@repo/shared/model/room";
import { and, desc, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

export class RoomService {
	private readonly encoder = new TextEncoder();

	constructor(private readonly db: DrizzleClient) {}

	async findMany(): Promise<GetRoomListResponseBody> {
		const games = await this.db
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

		const players = await this.db
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
	}

	async create({
		sub,
		...dto
	}: CreateRoomRequestBody & {
		sub: User["sub"] | null;
	}): Promise<CreateRoomResponseBody> {
		const authUser = await (async () => {
			if (!sub) return null;

			const [findUser] = await this.db
				.select({ id: userTable.id })
				.from(userTable)
				.where(eq(userTable.sub, sub));

			return findUser;
		})();

		const { gameToken, gameTokenHash } = this.generateGameTokenPair();
		const gameId = crypto.randomUUID();
		const playerId = crypto.randomUUID();

		const [createdGame] = await this.db.batch([
			this.db
				.insert(gameTable)
				.values({
					id: gameId,
					isPrivate: dto.isPrivate,
					password: dto.isPrivate ? this.generateRoomPassword() : null,
					timeLimit: dto.timeLimit,
					title: dto.title,
				})
				.returning({ id: gameTable.id }),
			this.db.insert(playerTable).values({
				gameId,
				gameTokenHash,
				id: playerId,
				isHost: true,
				playerName: dto.playerName,
				seat: 1,
				userId: authUser?.id ?? null,
			}),
		]);

		const [game] = createdGame ?? [];

		if (!game) {
			throw new HTTPException(500, {
				message: "作成したGameの取得に失敗しました",
			});
		}

		return { gameId: game.id, token: gameToken };
	}

	async join({
		gameId,
		password,
		playerName,
		sub,
		heldToken,
	}: {
		gameId: string;
	} & JoinRoomRequestBody & {
			sub: User["sub"] | null;
		}): Promise<JoinRoomResponseBody> {
		const [findGame] = await this.db
			.select({
				id: gameTable.id,
				isPrivate: gameTable.isPrivate,
				password: gameTable.password,
				status: gameTable.status,
			})
			.from(gameTable)
			.where(eq(gameTable.id, gameId));

		if (!findGame) {
			throw new HTTPException(404, {
				message: "指定された部屋が存在しません",
			});
		}

		if (findGame.status !== "waiting") {
			throw new HTTPException(400, {
				message: "この部屋は現在募集していません",
			});
		}

		if (findGame.isPrivate) {
			if (!password) {
				throw new HTTPException(400, {
					message: "パスワードを入力してください",
				});
			}

			if (password !== findGame.password) {
				throw new HTTPException(403, {
					message: "パスワードが正しくありません",
				});
			}
		}

		const participatingPlayers = await this.db
			.select({
				id: playerTable.id,
				seat: playerTable.seat,
				userId: playerTable.userId,
			})
			.from(playerTable)
			.where(eq(playerTable.gameId, findGame.id));

		if (heldToken) {
			const heldTokenHash = this.hashGameToken(heldToken);
			const [heldTokenPlayer] = await this.db
				.select({
					id: playerTable.id,
				})
				.from(playerTable)
				.where(
					and(
						eq(playerTable.gameId, findGame.id),
						eq(playerTable.gameTokenHash, heldTokenHash),
					),
				);

			if (heldTokenPlayer) {
				return { state: "HELD_TOKEN_PLAYER_JOINED" };
			}
		}

		const authUser = await (async () => {
			if (!sub) return null;

			const [findUser] = await this.db
				.select({ id: userTable.id })
				.from(userTable)
				.where(eq(userTable.sub, sub));

			return findUser;
		})();

		const { gameToken, gameTokenHash } = this.generateGameTokenPair();

		if (
			authUser &&
			participatingPlayers.some((player) => player.userId === authUser.id)
		) {
			await this.db.batch([
				this.db
					.update(playerTable)
					.set({ gameTokenHash })
					.where(
						and(
							eq(playerTable.gameId, findGame.id),
							eq(playerTable.userId, authUser.id),
						),
					),
			]);

			return { state: "USER_PLAYER_JOINED", token: gameToken };
		}

		const seat = this.assignSeat(
			participatingPlayers.map((player) => player.seat),
		);
		if (participatingPlayers.length >= 4) {
			throw new HTTPException(409, { message: "この部屋は満員です" });
		}
		if (!seat || !isPlayerSeat(seat)) {
			throw new HTTPException(409, { message: "席番号が正しくありません" });
		}

		await this.db.batch([
			this.db.insert(playerTable).values({
				gameId: findGame.id,
				gameTokenHash,
				id: crypto.randomUUID(),
				isHost: false,
				playerName,
				seat,
				userId: authUser?.id,
			}),
		]);

		return { state: "USUAL", token: gameToken };
	}

	private generateRoomPassword(length = 6): string {
		const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
		let password = "";
		for (let i = 0; i < length; i++) {
			password += CHARACTERS.charAt(
				Math.floor(Math.random() * CHARACTERS.length),
			);
		}
		return password;
	}

	private generateGameTokenPair(): {
		gameToken: string;
		gameTokenHash: string;
	} {
		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const gameToken = encodeBase64urlNoPadding(bytes);
		return { gameToken, gameTokenHash: this.hashGameToken(gameToken) };
	}

	private hashGameToken(gameToken: string): string {
		const hash = sha256(this.encoder.encode(gameToken));
		return bytesToHex(hash);
	}

	private assignSeat(seats: number[]): number | undefined {
		for (let seat = 1; seat <= 4; seat++) {
			if (!seats.includes(seat)) {
				return seat;
			}
		}
	}
}
