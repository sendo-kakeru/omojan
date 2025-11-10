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
				isHost: true,
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
		gameId: string;
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

			const seat = this.assignSeat(
				participatingPlayers.map((player) => player.seat),
			);
			if (!seat || participatingPlayers.length >= 4) {
				throw new HTTPException(400, { message: "この部屋は満員です" });
			}
			if (!isPlayerSeat(seat)) {
				throw new HTTPException(409, { message: "席番号が正しくありません" });
			}

			// NOTE: 退出時にプレイヤーを消すので基本的には起きないはずだが、念のため参加済みか検証
			const authUser = await (async () => {
				if (!sub) return null;

				const [findUser] = await tx
					.select({ id: userTable.id })
					.from(userTable)
					.where(eq(userTable.sub, sub));

				return findUser;
			})();

			if (
				authUser &&
				participatingPlayers.some((player) => player.userId === authUser.id)
			) {
				throw new HTTPException(409, {
					message: "既にこの部屋に参加しています",
				});
			}

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
					throw new HTTPException(409, {
						message: "既にこの部屋に参加しています",
					});
				}
			}

			const { gameToken, gameTokenHash } = this.generateGameTokenPair();

			await tx.insert(playerTable).values({
				gameId: findGame.id,
				gameTokenHash,
				isHost: false,
				playerName,
				seat,
				userId: authUser?.id,
			});

			return { token: gameToken };
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

	private hashGameToken(gameToken: string): string {
		const hash = sha256(this.encoder.encode(gameToken)); // Uint8Array
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
