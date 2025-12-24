import type { ResultSet } from "@libsql/client";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { encodeBase64urlNoPadding } from "@oslojs/encoding";
import type {
	CreateRoomRequestBody,
	CreateRoomResponseBody,
	GetRoomListResponseBody,
	GetRoomResponseBody,
	JoinRoomRequestBody,
	JoinRoomResponseBody,
} from "@repo/db/model";
import {
	type Game,
	type GameId,
	gameTable,
	isPlayerSeat,
	type PlayerSeat,
	playerTable,
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
	async findByGameId({
		gameId,
		gameToken,
	}: {
		gameId: GameId;
		gameToken: string;
	}): Promise<GetRoomResponseBody> {
		const gameTokenHash = this.hashGameToken(gameToken);

		const [game] = await this.db
			.select({
				isPrivate: gameTable.isPrivate,
				password: gameTable.password,
				timeLimit: gameTable.timeLimit,
				title: gameTable.title,
			})
			.from(gameTable)
			.where(eq(gameTable.id, gameId));

		if (!game) {
			throw new HTTPException(404, { message: "指定された部屋が存在しません" });
		}

		const players = await this.db
			.select({
				gameTokenHash: playerTable.gameTokenHash,
			})
			.from(playerTable)
			.where(eq(playerTable.gameId, gameId));

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
	async findMany(): Promise<GetRoomListResponseBody> {
		return await this.db.transaction(async (tx) => {
			// game取得
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

			// gameのプレイヤー取得
			const players = await tx
				.select({
					gameId: playerTable.gameId,
					id: playerTable.id,
					image: userTable.image,
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

			// gameIdごとにplayersをグルーピング
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
				throw new HTTPException(500, {
					message: "作成したGameの取得に失敗しました",
				});
			}

			// player作成
			const { gameToken, gameTokenHash } = this.generateGameTokenPair();

			await tx.insert(playerTable).values({
				gameId: createdGame.id,
				gameTokenHash,
				playerName: dto.playerName,
				seat: 1,
				userId: authUser?.id ?? null,
			});

			return { gameId: createdGame.id, token: gameToken };
		});
	}
	async join({
		gameId,
		password,
		playerName,
		sub,
		heldToken,
	}: {
		gameId: GameId;
	} & JoinRoomRequestBody & {
			sub: User["sub"] | null;
		}): Promise<JoinRoomResponseBody> {
		return await this.db.transaction(async (tx) => {
			// game取得
			const [findGame] = await tx
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

			// 参加中のplayer取得
			const participatingPlayers = await tx
				.select({
					id: playerTable.id,
					seat: playerTable.seat,
					userId: playerTable.userId,
				})
				.from(playerTable)
				.where(eq(playerTable.gameId, findGame.id));

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
							eq(playerTable.gameId, findGame.id),
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
							eq(playerTable.gameId, findGame.id),
							eq(playerTable.userId, authUser.id),
						),
					);

				return { state: "USER_PLAYER_JOINED", token: gameToken };
			}

			// 空いている席を割り当てて参加処理
			const [seat] = this.getEmptySeats(
				participatingPlayers.map((player) => player.seat),
			);

			// 空いている席がない場合
			if (!seat) {
				if (findGame.status === "waiting") {
					// 仮に満員なのにwaitingのままになっている場合、activeにする
					await this.activate({
						db: tx,
						gameId: findGame.id,
					});
				}
				throw new HTTPException(409, { message: "この部屋は満員です" });
			}

			// 通常の参加の場合はplayerを作成してトークンを返す
			await tx.insert(playerTable).values({
				gameId: findGame.id,
				gameTokenHash,
				playerName,
				seat,
				userId: authUser?.id,
			});

			if (
				participatingPlayers.length + 1 >= 4 &&
				findGame.status === "waiting"
			) {
				await this.activate({
					db: tx,
					gameId: findGame.id,
				});
			}

			return { state: "USUAL", token: gameToken };
		});
	}

	async startWithCpu({ gameId }: { gameId: GameId }): Promise<void> {
		await this.db.transaction(async (tx) => {
			const [game] = await tx
				.select({
					status: gameTable.status,
				})
				.from(gameTable)
				.where(eq(gameTable.id, gameId));

			if (!game) {
				throw new HTTPException(404, {
					message: "指定された部屋が存在しません",
				});
			}

			if (game.status !== "waiting") {
				throw new HTTPException(409, {
					message: "この部屋は現在募集していません",
				});
			}

			const participatingPlayers = await tx
				.select({
					seat: playerTable.seat,
				})
				.from(playerTable)
				.where(eq(playerTable.gameId, gameId));

			const emptySeats = this.getEmptySeats(
				participatingPlayers.map((player) => player.seat),
			);

			for (const seat of emptySeats) {
				const { gameTokenHash } = this.generateGameTokenPair();
				await tx.insert(playerTable).values({
					gameId,
					gameTokenHash,
					isCpu: true,
					playerName: "CPU",
					seat,
					userId: null,
				});
			}

			await this.activate({
				db: tx,
				gameId,
			});
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
		gameId,
	}: {
		db:
			| DrizzleClient
			| SQLiteTransaction<
					"async",
					ResultSet,
					Record<string, never>,
					ExtractTablesWithRelations<Record<string, never>>
			  >;
		gameId: GameId;
	}): Promise<void> {
		await db
			.update(gameTable)
			.set({ status: "active" })
			.where(eq(gameTable.id, gameId));
	}

	private getEmptySeats(exitSeats: PlayerSeat[]): PlayerSeat[] {
		const exitSeatsSet = new Set(exitSeats);
		const emptySeats: PlayerSeat[] = [];

		for (let seat = 1; seat <= 4; seat++) {
			if (!isPlayerSeat(seat)) continue;
			if (!exitSeatsSet.has(seat)) {
				emptySeats.push(seat);
			}
		}

		return emptySeats;
	}

	async getStatus(gameId: GameId): Promise<Game["status"] | null> {
		try {
			const [game] = await this.db
				.select({
					status: gameTable.status,
				})
				.from(gameTable)
				.where(eq(gameTable.id, gameId));

			return game?.status ?? null;
		} catch {
			return null;
		}
	}
}
