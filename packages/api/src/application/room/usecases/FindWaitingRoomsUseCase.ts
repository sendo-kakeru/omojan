import type { GetRoomListResponseBody } from "@repo/shared/model/room";
import type { RoomRepository } from "../../../domain/room/RoomRepository";

export class FindWaitingRoomsUseCase {
	constructor(private readonly roomRepository: RoomRepository) {}

	async execute(): Promise<GetRoomListResponseBody> {
		const rooms = await this.roomRepository.findWaitingRooms();

		return rooms.map((room) => ({
			gameId: room.id,
			isPrivate: room.isPrivate,
			players: room.getPlayersInSeatOrder().map((player) => ({
				id: player.id ?? null,
				image: player.image,
				isHost: player.isHost,
				playerName: player.playerName,
				seat: player.seat,
			})),
			timeLimit: room.timeLimit,
			title: room.title,
		}));
	}
}
