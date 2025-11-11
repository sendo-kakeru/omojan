import type { RoomPasswordService } from "../../domain/room/RoomPasswordService";
import type { RoomRepository } from "../../domain/room/RoomRepository";
import type { RoomTokenService } from "../../domain/room/RoomTokenService";
import type { UserRepository } from "../../domain/user/UserRepository";
import { RoomApplicationService } from "./RoomApplicationService";
import { CreateRoomUseCase } from "./usecases/CreateRoomUseCase";
import { FindWaitingRoomsUseCase } from "./usecases/FindWaitingRoomsUseCase";
import { JoinRoomUseCase } from "./usecases/JoinRoomUseCase";

export interface RoomApplicationDependencies {
	readonly roomRepository: RoomRepository;
	readonly userRepository: UserRepository;
	readonly roomPasswordService: RoomPasswordService;
	readonly roomTokenService: RoomTokenService;
}

export function createRoomApplicationService({
	roomRepository,
	userRepository,
	roomPasswordService,
	roomTokenService,
}: RoomApplicationDependencies): RoomApplicationService {
	const findWaitingRoomsUseCase = new FindWaitingRoomsUseCase(roomRepository);
	const createRoomUseCase = new CreateRoomUseCase(
		roomRepository,
		userRepository,
		roomPasswordService,
		roomTokenService,
	);
	const joinRoomUseCase = new JoinRoomUseCase(
		roomRepository,
		userRepository,
		roomTokenService,
	);

	return new RoomApplicationService(
		findWaitingRoomsUseCase,
		createRoomUseCase,
		joinRoomUseCase,
	);
}
