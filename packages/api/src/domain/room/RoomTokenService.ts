export interface GeneratedRoomToken {
	readonly token: string;
	readonly hash: string;
}

export interface RoomTokenService {
	generate(): GeneratedRoomToken;
	hash(token: string): string;
}
