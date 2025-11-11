import type { Room } from "./Room";
import type { RoomPlayer } from "./RoomPlayer";

export interface CreateRoomCommand {
	readonly title: string;
	readonly timeLimit: number;
	readonly isPrivate: boolean;
	readonly password: string | null;
	readonly hostPlayerName: string;
	readonly hostUserId: string | null;
	readonly hostTokenHash: string;
}

export interface AddPlayerCommand {
	readonly gameId: string;
	readonly player: RoomPlayer;
	readonly tokenHash: string;
}

export interface RoomRepository {
	findWaitingRooms(): Promise<Room[]>;
	findById(gameId: string): Promise<Room | null>;
	createRoom(command: CreateRoomCommand): Promise<{ roomId: string }>;
	findPlayerIdByTokenHash(
		gameId: string,
		tokenHash: string,
	): Promise<string | null>;
	findPlayerIdByUserId(gameId: string, userId: string): Promise<string | null>;
	updatePlayerTokenHash(playerId: string, tokenHash: string): Promise<void>;
	addPlayer(command: AddPlayerCommand): Promise<void>;
}
