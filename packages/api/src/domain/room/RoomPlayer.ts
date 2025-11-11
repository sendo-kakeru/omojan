export type PlayerSeat = 1 | 2 | 3 | 4;

export interface RoomPlayerProps {
	readonly id?: string;
	readonly playerName: string;
	readonly seat: PlayerSeat;
	readonly isHost: boolean;
	readonly userId?: string | null;
	readonly image?: string | null;
}

export class RoomPlayer {
	constructor(private readonly props: RoomPlayerProps) {}

	get id(): string | undefined {
		return this.props.id;
	}

	get seat(): PlayerSeat {
		return this.props.seat;
	}

	get playerName(): string {
		return this.props.playerName;
	}

	get isHost(): boolean {
		return this.props.isHost;
	}

	get userId(): string | null {
		return this.props.userId ?? null;
	}

	get image(): string | null {
		return this.props.image ?? null;
	}

	toSummary() {
		return {
			id: this.id ?? null,
			image: this.image,
			isHost: this.isHost,
			playerName: this.playerName,
			seat: this.seat,
		} as const;
	}

	static sortBySeat(players: RoomPlayer[]): RoomPlayer[] {
		return [...players].sort((a, b) => a.seat - b.seat);
	}

	static createHost(
		props: Omit<RoomPlayerProps, "isHost" | "seat">,
	): RoomPlayer {
		return new RoomPlayer({ ...props, isHost: true, seat: 1 });
	}

	static createParticipant(
		props: Omit<RoomPlayerProps, "isHost"> & { seat: PlayerSeat },
	): RoomPlayer {
		return new RoomPlayer({ ...props, isHost: false });
	}
}
