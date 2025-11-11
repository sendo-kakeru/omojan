export interface UserIdentity {
	readonly id: string;
}

export interface UserRepository {
	findBySub(sub: string): Promise<UserIdentity | null>;
}
