import {
	RoomClosedError,
	RoomIsFullError,
	RoomPasswordMismatchError,
	RoomPasswordRequiredError,
} from "./errors";
import { type PlayerSeat, RoomPlayer } from "./RoomPlayer";

type RoomStatus = "waiting" | "active" | "finished";

export interface RoomProps {
	readonly id: string;
	readonly title: string;
	readonly timeLimit: number;
	readonly isPrivate: boolean;
	readonly status: RoomStatus;
	readonly password: string | null;
	readonly players: RoomPlayer[];
}

export class Room {
	constructor(private readonly props: RoomProps) {}

	get id(): string {
		return this.props.id;
	}

	get title(): string {
		return this.props.title;
	}

	get timeLimit(): number {
		return this.props.timeLimit;
	}

	get isPrivate(): boolean {
		return this.props.isPrivate;
	}

	get status(): RoomStatus {
		return this.props.status;
	}

	get players(): RoomPlayer[] {
		return [...this.props.players];
	}

	ensureWaiting(): void {
		if (this.status !== "waiting") {
			throw new RoomClosedError();
		}
	}

	ensurePasswordIsValid(password: string | null | undefined): void {
		if (!this.isPrivate) return;

		if (!password) {
			throw new RoomPasswordRequiredError();
		}

		if (this.props.password !== password) {
			throw new RoomPasswordMismatchError();
		}
	}

	getAvailableSeat(): PlayerSeat | undefined {
		const occupiedSeats = new Set(this.players.map((player) => player.seat));

		for (const seat of [1, 2, 3, 4] as const) {
			if (!occupiedSeats.has(seat)) {
				return seat;
			}
		}
	}

	ensureHasCapacity(): void {
		if (!this.getAvailableSeat()) {
			throw new RoomIsFullError();
		}
	}

	getPlayersInSeatOrder(): RoomPlayer[] {
		return RoomPlayer.sortBySeat(this.players);
	}
}
