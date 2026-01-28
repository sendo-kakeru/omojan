PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		);
INSERT INTO __drizzle_migrations VALUES(NULL,'95509737e32a28dc45729b6ba0c163bf0e0dc0ab3cbf3c6937a063cefc192c5d',1769601198466);
CREATE TABLE IF NOT EXISTS `game` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`time_limit` integer NOT NULL,
	`title` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `player` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`game_token_hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_cpu` integer DEFAULT false NOT NULL,
	`is_host` integer DEFAULT false NOT NULL,
	`player_name` text NOT NULL,
	`seat` integer NOT NULL,
	`user_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE IF NOT EXISTS `player_card` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text,
	`submission_id` text,
	`text` text NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE IF NOT EXISTS `round` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_no` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round_theme` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`text` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `submission` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`position` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `user` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sub` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `vote` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `player_game_token_hash_unique` ON `player` (`game_token_hash`);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE UNIQUE INDEX `user_sub_unique` ON `user` (`sub`);
COMMIT;
