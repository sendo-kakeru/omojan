PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		);
INSERT INTO __drizzle_migrations VALUES(NULL,'05f08e65e51151aa1674737830f7c0ccb3f6161941cdaf16e9cc39cc998ce645',1763384773458);
INSERT INTO __drizzle_migrations VALUES(NULL,'8f491c39b0d6fa798534ce27cd8f3b7fdac29c78f77eafed0bbd135e8b22c6fe',1763649496596);
CREATE TABLE IF NOT EXISTS `game` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`is_private` integer DEFAULT false NOT NULL,
	`password` text,
	`status` text DEFAULT 'waiting' NOT NULL,
	`time_limit` integer NOT NULL,
	`title` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `player` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`game_token_hash` text NOT NULL,
	`player_name` text NOT NULL,
	`seat` integer NOT NULL,
	`user_id` text,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE IF NOT EXISTS `player_card` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	`word_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `word`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`round_no` integer NOT NULL,
	`status` text DEFAULT 'submitting' NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round_theme` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`round_id` text NOT NULL,
	`word_id` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`word_id`) REFERENCES `word`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round_winner` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `submission` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`position` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `user` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`email` text NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sub` text NOT NULL
);
CREATE TABLE IF NOT EXISTS `vote` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `word` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`updated_at` text NOT NULL,
	`text` text NOT NULL
);
CREATE UNIQUE INDEX `player_game_token_hash_unique` ON `player` (`game_token_hash`);
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
CREATE UNIQUE INDEX `user_sub_unique` ON `user` (`sub`);
CREATE UNIQUE INDEX `word_text_unique` ON `word` (`text`);
COMMIT;
