import type {
	JoinRoomRequestBody,
	JoinRoomResponseBody,
} from "@repo/shared/model/room";
import {
	RoomIsFullError,
	RoomNotFoundError,
} from "../../../domain/room/errors";
import { RoomPlayer } from "../../../domain/room/RoomPlayer";
import type { RoomRepository } from "../../../domain/room/RoomRepository";
import type { RoomTokenService } from "../../../domain/room/RoomTokenService";
import type { UserRepository } from "../../../domain/user/UserRepository";

export type JoinRoomCommand = JoinRoomRequestBody & {
	readonly gameId: string;
	readonly sub: string | null;
	readonly heldToken: string | null;
};

export class JoinRoomUseCase {
	constructor(
		private readonly roomRepository: RoomRepository,
		private readonly userRepository: UserRepository,
		private readonly roomTokenService: RoomTokenService,
	) {}

	async execute(command: JoinRoomCommand): Promise<JoinRoomResponseBody> {
		const room = await this.roomRepository.findById(command.gameId);

		if (!room) {
			throw new RoomNotFoundError();
		}

		room.ensureWaiting();
		room.ensurePasswordIsValid(command.password ?? null);

		if (command.heldToken) {
			const heldTokenHash = this.roomTokenService.hash(command.heldToken);
			const playerId = await this.roomRepository.findPlayerIdByTokenHash(
				room.id,
				heldTokenHash,
			);

			if (playerId) {
				return { state: "HELD_TOKEN_PLAYER_JOINED" };
			}
		}

		const user = command.sub
			? await this.userRepository.findBySub(command.sub)
			: null;

		if (user) {
			const joinedPlayerId = await this.roomRepository.findPlayerIdByUserId(
				room.id,
				user.id,
			);

			if (joinedPlayerId) {
				const generatedToken = this.roomTokenService.generate();
				await this.roomRepository.updatePlayerTokenHash(
					joinedPlayerId,
					generatedToken.hash,
				);

				return { state: "USER_PLAYER_JOINED", token: generatedToken.token };
			}
		}

		const seat = room.getAvailableSeat();
		if (!seat) {
			throw new RoomIsFullError();
		}

		const generatedToken = this.roomTokenService.generate();
		const player = RoomPlayer.createParticipant({
			id: undefined,
			image: null,
			playerName: command.playerName,
			seat,
			userId: user?.id ?? null,
		});

		await this.roomRepository.addPlayer({
			gameId: room.id,
			player,
			tokenHash: generatedToken.hash,
		});

		return { state: "USUAL", token: generatedToken.token };
	}
}
