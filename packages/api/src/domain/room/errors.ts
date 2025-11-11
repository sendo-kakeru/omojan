export class RoomNotFoundError extends Error {
	constructor(message = "指定された部屋が存在しません") {
		super(message);
		this.name = "RoomNotFoundError";
	}
}

export class RoomClosedError extends Error {
	constructor(message = "この部屋は現在募集していません") {
		super(message);
		this.name = "RoomClosedError";
	}
}

export class RoomPasswordRequiredError extends Error {
	constructor(message = "パスワードを入力してください") {
		super(message);
		this.name = "RoomPasswordRequiredError";
	}
}

export class RoomPasswordMismatchError extends Error {
	constructor(message = "パスワードが正しくありません") {
		super(message);
		this.name = "RoomPasswordMismatchError";
	}
}

export class RoomIsFullError extends Error {
	constructor(message = "この部屋は満員です") {
		super(message);
		this.name = "RoomIsFullError";
	}
}
