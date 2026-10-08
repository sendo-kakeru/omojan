CREATE TABLE `game_counter` (
	`count` integer NOT NULL,
	`status` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
INSERT INTO `game_counter` (`status`, `count`)
SELECT 'finished', count(*) FROM `game` WHERE `status` = 'finished';
