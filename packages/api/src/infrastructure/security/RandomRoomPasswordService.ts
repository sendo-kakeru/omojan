import type { RoomPasswordService } from "../../domain/room/RoomPasswordService";

const DEFAULT_PASSWORD_LENGTH = 6;
const CHARACTERS = "abcdefghijklmnopqrstuvwxyz0123456789";

export class RandomRoomPasswordService implements RoomPasswordService {
	constructor(private readonly length: number = DEFAULT_PASSWORD_LENGTH) {}

	generate(): string {
		let password = "";
		for (let index = 0; index < this.length; index++) {
			const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
			password += CHARACTERS.charAt(randomIndex);
		}
		return password;
	}
}
