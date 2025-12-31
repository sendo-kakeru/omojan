import type {
	GamePlayerCard,
	GameServerRoundStartMessage,
} from "@repo/db/model";
import {
	type GameId,
	gameTable,
	isRoundNo,
	type PlayerCard,
	type PlayerId,
	type PlayerSeat,
	playerCardTable,
	playerTable,
	type RoundId,
	type RoundNo,
	type RoundTheme,
	roundTable,
	roundThemeTable,
	userTable,
} from "@repo/db/schema";
import { WORDS } from "@repo/shared/constants/words";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { DrizzleClient } from "../../libs/drizzle";

export class GameService {
	constructor(private readonly db: DrizzleClient) {}

	/**
	 * ゲーム開始処理
	 * - 4ラウンド作成
	 * - 各ラウンドにテーマ牌を割り当て
	 * - 各プレイヤーに7枚の手持ち牌を配布
	 */
	async initializeGame({ gameId }: { gameId: GameId }): Promise<
		Omit<GameServerRoundStartMessage["game"], "theme"> & {
			playerCards: Map<PlayerId, GamePlayerCard[]>;
			themes: Map<RoundNo, RoundTheme["text"]>;
		}
	> {
		return await this.db.transaction(async (tx) => {
			// ゲーム情報取得
			const [game] = await tx
				.select({
					timeLimit: gameTable.timeLimit,
				})
				.from(gameTable)
				.where(eq(gameTable.id, gameId));

			if (!game) {
				throw new HTTPException(404, { message: "ゲームが見つかりません。" });
			}

			// プレイヤー一覧を取得
			const players = await tx
				.select({
					id: playerTable.id,
					image: userTable.image,
					playerName: playerTable.playerName,
					seat: playerTable.seat,
				})
				.from(playerTable)
				.leftJoin(userTable, eq(playerTable.userId, userTable.id))
				.where(eq(playerTable.gameId, gameId));

			if (players.length < 4) {
				// 通常はあり得ない
				throw new HTTPException(409, {
					message: "プレイヤーが不足しています。",
				});
			}

			const { themeWords, playerWords } = this.getGameWords();

			// 4ラウンド作成
			const roundIds: RoundId[] = [];
			for (let roundNo = 1; roundNo <= 4; roundNo++) {
				if (!isRoundNo(roundNo)) continue;

				const [round] = await tx
					.insert(roundTable)
					.values({
						gameId,
						roundNo,
					})
					.returning({ id: roundTable.id });

				if (!round) {
					throw new HTTPException(500, {
						message: "ラウンドの作成に失敗しました",
					});
				}
				roundIds.push(round.id);

				// テーマ牌を作成
				const themeWord = themeWords[roundNo - 1];
				if (!themeWord) {
					// 通常はあり得ない
					throw new HTTPException(409, {
						message: "テーマ牌の抽出に失敗しました",
					});
				}

				await tx.insert(roundThemeTable).values({
					roundId: round.id,
					text: themeWord,
				});
			}

			// 最初のラウンドを取得
			const firstRoundId = roundIds[0];
			if (!firstRoundId) {
				throw new HTTPException(500, {
					message: "ラウンドの作成に失敗しました",
				});
			}

			// 各プレイヤーに7枚の手持ち牌を配布
			const playerCardsMap = new Map<PlayerId, GamePlayerCard[]>();
			let handWordIndex = 0;

			for (const player of players) {
				const cardsForPlayer: GamePlayerCard[] = [];

				for (let i = 0; i < 7; i++) {
					const word = playerWords[handWordIndex];
					if (!word) {
						throw new HTTPException(409, {
							message: "手持ち牌の配布に失敗しました。",
						});
					}

					const [card] = await tx
						.insert(playerCardTable)
						.values({
							playerId: player.id,
							roundId: firstRoundId,
							text: word,
						})
						.returning({ id: playerCardTable.id, text: playerCardTable.text });

					if (card) {
						cardsForPlayer.push({ id: card.id, used: false, word: card.text });
					}
					handWordIndex++;
				}
				playerCardsMap.set(player.id, cardsForPlayer);
			}

			// テーマをラウンドごとにグルーピング
			const roundGroupedThemes = new Map<RoundNo, RoundTheme["text"]>();
			for (let i = 0; i < themeWords.length; i++) {
				const roundNo = i + 1;
				if (!isRoundNo(roundNo)) continue;

				const themeWord = themeWords[i];
				if (themeWord) {
					roundGroupedThemes.set(roundNo, themeWord);
				}
			}

			return {
				playerCards: playerCardsMap,
				players: players
					.sort((a, b) => a.seat - b.seat)
					.map((player) => ({
						...player,
						submission: null,
						winCount: 0,
					})),
				roundNo: 1,
				submitted: null,
				themes: roundGroupedThemes,
				timeLimit: game.timeLimit,
			} satisfies Omit<GameServerRoundStartMessage["game"], "theme"> & {
				playerCards: Map<PlayerId, GamePlayerCard[]>;
				themes: Map<RoundNo, RoundTheme["text"]>;
			};
		});
	}

	/**
	 * ラウンド番号と席順から、そのラウンドでのターン順を算出する。
	 * - ラウンド1: 席順1→2→3→4
	 * - ラウンド2: 席順2→3→4→1
	 * - ラウンド3: 席順3→4→1→2
	 * - ラウンド4: 席順4→1→2→3
	 */
	calculateTurnOrder({
		roundNo,
		seat,
	}: {
		roundNo: RoundNo;
		seat: PlayerSeat;
	}): number {
		// (seat - roundNo) mod 4 で0-3の順番を得て、1-4に変換
		return ((seat - roundNo + 4) % 4) + 1;
	}

	/**
	 * プレイヤー配列をラウンドに応じたターン順で並び替えて返す。
	 */
	sortTurnOrderPlayers<T extends { seat: RoundNo }>({
		players,
		roundNo,
	}: {
		players: T[];
		roundNo: RoundNo;
	}): T[] {
		return [...players].sort((a, b) => {
			const orderA = this.calculateTurnOrder({ roundNo, seat: a.seat });
			const orderB = this.calculateTurnOrder({ roundNo, seat: b.seat });
			return orderA - orderB;
		});
	}

	/**
	 * 有効な単語からテーマ牌(4枚)と手持ち牌(28枚)を重複なしでランダム抽出
	 */
	private getGameWords(): {
		playerWords: PlayerCard["text"][];
		themeWords: RoundTheme["text"][];
	} {
		const THEME_COUNT = 4;
		const HAND_CARD_COUNT = 28; // 4人 x 7枚

		// 有効な単語のみ抽出してシャッフル
		const enabledTexts = WORDS.filter((word) => word.enabled).map(
			(word) => word.text,
		);

		// Fisher-Yatesシャッフル
		for (let i = enabledTexts.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const temp = enabledTexts[i];
			const swap = enabledTexts[j];
			if (temp !== undefined && swap !== undefined) {
				enabledTexts[i] = swap;
				enabledTexts[j] = temp;
			}
		}

		return {
			playerWords: enabledTexts.slice(
				THEME_COUNT,
				THEME_COUNT + HAND_CARD_COUNT,
			),
			themeWords: enabledTexts.slice(0, THEME_COUNT),
		};
	}
}
