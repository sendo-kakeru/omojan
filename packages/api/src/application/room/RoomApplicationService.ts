import type {
	CreateRoomResponseBody,
	GetRoomListResponseBody,
	JoinRoomResponseBody,
} from "@repo/shared/model/room";
import type {
	CreateRoomCommand,
	CreateRoomUseCase,
} from "./usecases/CreateRoomUseCase";
import type { FindWaitingRoomsUseCase } from "./usecases/FindWaitingRoomsUseCase";
import type {
	JoinRoomCommand,
	JoinRoomUseCase,
} from "./usecases/JoinRoomUseCase";

export class RoomApplicationService {
	constructor(
		private readonly findWaitingRoomsUseCase: FindWaitingRoomsUseCase,
		private readonly createRoomUseCase: CreateRoomUseCase,
		private readonly joinRoomUseCase: JoinRoomUseCase,
	) {}

	listWaitingRooms(): Promise<GetRoomListResponseBody> {
		return this.findWaitingRoomsUseCase.execute();
	}

	createRoom(command: CreateRoomCommand): Promise<CreateRoomResponseBody> {
		return this.createRoomUseCase.execute(command);
	}

	joinRoom(command: JoinRoomCommand): Promise<JoinRoomResponseBody> {
		return this.joinRoomUseCase.execute(command);
	}
}
