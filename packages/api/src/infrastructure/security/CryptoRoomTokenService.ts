import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { encodeBase64urlNoPadding } from "@oslojs/encoding";
import type {
	GeneratedRoomToken,
	RoomTokenService,
} from "../../domain/room/RoomTokenService";

export class CryptoRoomTokenService implements RoomTokenService {
	private readonly encoder = new TextEncoder();

	generate(): GeneratedRoomToken {
		const bytes = crypto.getRandomValues(new Uint8Array(32));
		const token = encodeBase64urlNoPadding(bytes);
		return { hash: this.hash(token), token };
	}

	hash(token: string): string {
		const hash = sha256(this.encoder.encode(token));
		return bytesToHex(hash);
	}
}
