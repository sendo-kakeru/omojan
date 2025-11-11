import type {
	CreateRoomRequestBody,
	CreateRoomResponseBody,
} from "@repo/shared/model/room";
import type { RoomPasswordService } from "../../../domain/room/RoomPasswordService";
import type { RoomRepository } from "../../../domain/room/RoomRepository";
import type { RoomTokenService } from "../../../domain/room/RoomTokenService";
import type { UserRepository } from "../../../domain/user/UserRepository";

export type CreateRoomCommand = CreateRoomRequestBody & {
	readonly sub: string | null;
};

export class CreateRoomUseCase {
	constructor(
		private readonly roomRepository: RoomRepository,
		private readonly userRepository: UserRepository,
		private readonly roomPasswordService: RoomPasswordService,
		private readonly roomTokenService: RoomTokenService,
	) {}

	async execute(command: CreateRoomCommand): Promise<CreateRoomResponseBody> {
		const user = command.sub
			? await this.userRepository.findBySub(command.sub)
			: null;
		const password = command.isPrivate
			? this.roomPasswordService.generate()
			: null;

		const generatedToken = this.roomTokenService.generate();

		const { roomId } = await this.roomRepository.createRoom({
			hostPlayerName: command.playerName,
			hostTokenHash: generatedToken.hash,
			hostUserId: user?.id ?? null,
			isPrivate: command.isPrivate,
			password,
			timeLimit: command.timeLimit,
			title: command.title,
		});

		return { gameId: roomId, token: generatedToken.token };
	}
}
