import type { ResultSet } from "@libsql/client";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { encodeBase64urlNoPadding } from "@oslojs/encoding";
import type {
	CreateGameRequestBody,
	CreateGameResponseBody,
	GetGameListResponseBody,
	GetGameResponseBody,
	JoinGameRequestBody,
	JoinGameResponseBody,
} from "@repo/db/model";
import {
	isPlayerSeat,
	playerTable,
	type Room,
	type RoomId,
	roomTable,
	type User,
	userTable,
} from "@repo/db/schema";
import {
	and,
	desc,
	type ExtractTablesWithRelations,
	eq,
	inArray,
} from "drizzle-orm";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

export class RoomService {
	private readonly encoder = new TextEncoder();

	constructor(private readonly db: DrizzleClient) {}

	/**
	 * ルームを単体取得する
	 */
	async findByRoomId({
		roomId,
		gameToken,
	}: {
		roomId: RoomId;
		gameToken: string;
	}): Promise<GetGameResponseBody> {
		const gameTokenHash = this.hashGameToken(gameToken);

		const [game] = await this.db
			.select({
				isPrivate: roomTable.isPrivate,
				password: roomTable.password,
				timeLimit: roomTable.timeLimit,
				title: roomTable.title,
			})
			.from(roomTable)
			.where(eq(roomTable.id, roomId));

		if (!game) {
			throw new HTTPException(404, { message: "指定された部屋が存在しません" });
		}

		const players = await this.db
			.select({
				gameTokenHash: playerTable.gameTokenHash,
			})
			.from(playerTable)
			.where(eq(playerTable.roomId, roomId));

		if (!players.some((player) => player.gameTokenHash === gameTokenHash)) {
			throw new HTTPException(403, {
				message: "部屋情報の取得権限がありません。",
			});
		}

		// 検証に使ったgameTokenを省いて返す
		return game;
	}

	/**
	 * 募集中のルーム一覧を取得する
	 */
	async findMany(): Promise<GetGameListResponseBody> {
		return await this.db.transaction(async (tx) => {
			// game取得
			const rooms = await tx
				.select({
					createdAt: roomTable.createdAt,
					id: roomTable.id,
					isPrivate: roomTable.isPrivate,
					timeLimit: roomTable.timeLimit,
					title: roomTable.title,
				})
				.from(roomTable)
				.where(eq(roomTable.status, "waiting"))
				.orderBy(desc(roomTable.createdAt));

			if (rooms.length === 0) return [];

			// gameのプレイヤー取得
			const players = await tx
				.select({
					id: playerTable.id,
					image: userTable.image,
					playerName: playerTable.playerName,
					roomId: playerTable.roomId,
					seat: playerTable.seat,
				})
				.from(playerTable)
				.leftJoin(userTable, eq(playerTable.userId, userTable.id))
				.where(
					inArray(
						playerTable.roomId,
						rooms.map((room) => room.id),
					),
				);

			// gameIdごとにplayersをグルーピング
			const groupedPlayersByRoomId = new Map<string, typeof players>();

			for (const player of players) {
				const arr = groupedPlayersByRoomId.get(player.roomId) ?? [];
				arr.push(player);
				groupedPlayersByRoomId.set(player.roomId, arr);
			}

			return rooms.map((room) => ({
				gameId: room.id,
				isPrivate: room.isPrivate,
				players: (groupedPlayersByRoomId.get(room.id) ?? [])
					.sort((a, b) => a.seat - b.seat)
					.map((player) => ({
						id: player.id,
						image: player.image,
						playerName: player.playerName,
						seat: player.seat,
					})),
				timeLimit: room.timeLimit,
				title: room.title,
			}));
		});
	}
	async create({
		sub,
		...dto
	}: CreateGameRequestBody & {
		sub: User["sub"] | null;
	}): Promise<CreateGameResponseBody> {
		return await this.db.transaction(async (tx) => {
			// 認証済みならユーザー取得
			// 匿名ならnullで続行
			const authUser = await (async () => {
				if (!sub) return null;

				const [findUser] = await tx
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.sub, sub));

				return findUser;
			})();

			// game作成
			const [createdRoom] = await tx
				.insert(roomTable)
				.values({
					isPrivate: dto.isPrivate,
					password: dto.isPrivate ? this.generateRoomPassword() : null,
					timeLimit: dto.timeLimit,
					title: dto.title,
				})
				.returning({ id: roomTable.id });

			if (!createdRoom) {
				throw new HTTPException(500, {
					message: "作成したRoomの取得に失敗しました",
				});
			}

			// player作成
			const { gameToken, gameTokenHash } = this.generateGameTokenPair();

			await tx.insert(playerTable).values({
				gameTokenHash,
				playerName: dto.playerName,
				roomId: createdRoom.id,
				seat: 1,
				userId: authUser?.id ?? null,
			});

			return { gameId: createdRoom.id, token: gameToken };
		});
	}
	async join({
		roomId,
		password,
		playerName,
		sub,
		heldToken,
	}: {
		roomId: RoomId;
	} & JoinGameRequestBody & {
			sub: User["sub"] | null;
		}): Promise<JoinGameResponseBody> {
		return await this.db.transaction(async (tx) => {
			// game取得
			const [findGame] = await tx
				.select({
					id: roomTable.id,
					isPrivate: roomTable.isPrivate,
					password: roomTable.password,
					status: roomTable.status,
				})
				.from(roomTable)
				.where(eq(roomTable.id, roomId));

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

			// 参加中のplayer取得
			const participatingPlayers = await tx
				.select({
					id: playerTable.id,
					seat: playerTable.seat,
					userId: playerTable.userId,
				})
				.from(playerTable)
				.where(eq(playerTable.roomId, findGame.id));

			// クライアントが保持しているトークンのプレイヤーが参加済み
			if (heldToken) {
				const heldTokenHash = this.hashGameToken(heldToken);
				const [heldTokenPlayer] = await tx
					.select({
						id: playerTable.id,
					})
					.from(playerTable)
					.where(
						and(
							eq(playerTable.roomId, findGame.id),
							eq(playerTable.gameTokenHash, heldTokenHash),
						),
					);

				if (heldTokenPlayer) {
					return { state: "HELD_TOKEN_PLAYER_JOINED" };
				}
			}

			const { gameToken, gameTokenHash } = this.generateGameTokenPair();

			const authUser = await (async () => {
				if (!sub) return null;

				const [findUser] = await tx
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.sub, sub));

				return findUser;
			})();

			// クライアントが保持しているトークンのプレイヤーは存在しないが、認証済みユーザーのプレイヤーが存在していたらトークンを生成して返す（通常は発生し得ない）
			if (
				authUser &&
				participatingPlayers.some((player) => player.userId === authUser.id)
			) {
				await tx
					.update(playerTable)
					.set({ gameTokenHash })
					.where(
						and(
							eq(playerTable.roomId, findGame.id),
							eq(playerTable.userId, authUser.id),
						),
					);

				return { state: "USER_PLAYER_JOINED", token: gameToken };
			}

			// 空いている席を割り当てて参加処理
			const seat = this.assignSeat(
				participatingPlayers.map((player) => player.seat),
			);
			if (participatingPlayers.length >= 4) {
				if (findGame.status === "waiting") {
					await this.activate({
						db: tx,
						roomId: findGame.id,
					});
				}
				throw new HTTPException(409, { message: "この部屋は満員です" });
			}
			if (!seat || !isPlayerSeat(seat)) {
				throw new HTTPException(409, { message: "席番号が正しくありません" });
			}

			// 通常の参加の場合はplayerを作成してトークンを返す
			await tx.insert(playerTable).values({
				gameTokenHash,
				playerName,
				roomId: findGame.id,
				seat,
				userId: authUser?.id,
			});

			if (
				participatingPlayers.length + 1 >= 4 &&
				findGame.status === "waiting"
			) {
				await this.activate({
					db: tx,
					roomId: findGame.id,
				});
			}

			return { state: "USUAL", token: gameToken };
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

	private generateGameTokenPair(): {
		gameToken: string;
		gameTokenHash: string;
	} {
		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const gameToken = encodeBase64urlNoPadding(bytes); // “=” なし
		return { gameToken, gameTokenHash: this.hashGameToken(gameToken) };
	}

	hashGameToken(gameToken: string): string {
		const hash = sha256(this.encoder.encode(gameToken)); // Uint8Array
		return bytesToHex(hash);
	}

	/**
	 * gameのステータスをactiveにする
	 */
	private async activate({
		db,
		roomId,
	}: {
		db:
			| DrizzleClient
			| SQLiteTransaction<
					"async",
					ResultSet,
					Record<string, never>,
					ExtractTablesWithRelations<Record<string, never>>
			  >;
		roomId: RoomId;
	}): Promise<void> {
		await db
			.update(roomTable)
			.set({ status: "active" })
			.where(eq(roomTable.id, roomId));
	}

	private assignSeat(seats: number[]): number | undefined {
		for (let seat = 1; seat <= 4; seat++) {
			if (!seats.includes(seat)) {
				return seat;
			}
		}
	}

	async getStatus(roomId: RoomId): Promise<Room["status"] | null> {
		try {
			const [game] = await this.db
				.select({
					status: roomTable.status,
				})
				.from(roomTable)
				.where(eq(roomTable.id, roomId));

			return game?.status ?? null;
		} catch {
			return null;
		}
	}
}
