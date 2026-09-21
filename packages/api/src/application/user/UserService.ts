import type { GetPublicUserResponseBody, PublicUser } from "@repo/db/models";
import {
	type GameId,
	gameTable,
	type PlayerId,
	playerTable,
	type RoundId,
	roundTable,
	submissionTable,
	type User,
	type UserId,
	userTable,
	voteTable,
} from "@repo/db/schemas";
import { and, eq, inArray } from "drizzle-orm";
import type { DrizzleClient } from "../../libs/drizzle";
import { GameService } from "../game/GameService";

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
		// ユーザーが参加した終了済みゲームのプレイヤーレコードを取得
		const players = await this.db
			.select({
				gameId: playerTable.gameId,
				playerId: playerTable.id,
			})
			.from(playerTable)
			.innerJoin(gameTable, eq(playerTable.gameId, gameTable.id))
			.where(
				and(eq(playerTable.userId, userId), eq(gameTable.status, "finished")),
			);

		const playCount = players.length;
		if (playCount === 0) return { playCount: 0, winCount: 0 };

		const gameIds = [...new Set(players.map((p) => p.gameId))];
		const playerIdsByGameId = new Map<GameId, PlayerId>();
		for (const p of players) {
			playerIdsByGameId.set(p.gameId, p.playerId);
		}

		// 全ゲームのラウンド・提出・投票を一括取得
		const rounds = await this.db
			.select({
				gameId: roundTable.gameId,
				id: roundTable.id,
			})
			.from(roundTable)
			.where(inArray(roundTable.gameId, gameIds));

		const roundIds = rounds.map((r) => r.id);

		const [submissions, votes] =
			roundIds.length > 0
				? await Promise.all([
						this.db
							.select({
								playerId: submissionTable.playerId,
								roundId: submissionTable.roundId,
								submissionId: submissionTable.id,
							})
							.from(submissionTable)
							.where(inArray(submissionTable.roundId, roundIds)),
						this.db
							.select({
								roundId: voteTable.roundId,
								submissionId: voteTable.submissionId,
							})
							.from(voteTable)
							.where(inArray(voteTable.roundId, roundIds)),
					])
				: [[], []];

		// Map で事前インデックス化
		const roundsByGameId = new Map<GameId, typeof rounds>();
		for (const round of rounds) {
			const arr = roundsByGameId.get(round.gameId) ?? [];
			arr.push(round);
			roundsByGameId.set(round.gameId, arr);
		}

		const submissionsByRoundId = new Map<RoundId, typeof submissions>();
		for (const sub of submissions) {
			const arr = submissionsByRoundId.get(sub.roundId) ?? [];
			arr.push(sub);
			submissionsByRoundId.set(sub.roundId, arr);
		}

		const votesByRoundId = new Map<RoundId, typeof votes>();
		for (const vote of votes) {
			const arr = votesByRoundId.get(vote.roundId) ?? [];
			arr.push(vote);
			votesByRoundId.set(vote.roundId, arr);
		}

		// ゲームごとに勝者を計算
		let winCount = 0;

		for (const gameId of gameIds) {
			const gameRounds = roundsByGameId.get(gameId) ?? [];
			const winCountByPlayer = new Map<PlayerId, number>();

			for (const round of gameRounds) {
				const roundSubmissions = submissionsByRoundId.get(round.id) ?? [];
				const roundVotes = votesByRoundId.get(round.id) ?? [];

				const { winnerPlayerIds } =
					GameService.calculateWinnersAndVoteCountsFromVotes({
						submissions: roundSubmissions,
						votes: roundVotes,
					});

				for (const playerId of winnerPlayerIds) {
					const current = winCountByPlayer.get(playerId) ?? 0;
					winCountByPlayer.set(playerId, current + 1);
				}
			}

			// ゲーム全体の勝者 = ラウンド勝利数が最大のプレイヤー
			let maxWinCount = 0;
			for (const count of winCountByPlayer.values()) {
				if (count > maxWinCount) maxWinCount = count;
			}
			if (maxWinCount > 0) {
				const userPlayerId = playerIdsByGameId.get(gameId);
				if (
					userPlayerId &&
					(winCountByPlayer.get(userPlayerId) ?? 0) === maxWinCount
				) {
					winCount++;
				}
			}
		}

		return { playCount, winCount };
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
