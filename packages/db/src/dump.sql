PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
			id SERIAL PRIMARY KEY,
			hash text NOT NULL,
			created_at numeric
		);
INSERT INTO __drizzle_migrations VALUES(NULL,'85e8e30bb53f0598b25de849af1aa5e70f8791e7445156ffa34290443771378d',1765191260543);
INSERT INTO __drizzle_migrations VALUES(NULL,'35e19d4ace100bdaee3895b54a9df902fae7e91be8525ac1e55eadf94cadd356',1765286580259);
INSERT INTO __drizzle_migrations VALUES(NULL,'5fd36bf52f73836d77a8b78a065b63d0dc6008c639f26400d6b6f72f2728660a',1765371200000);
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
INSERT INTO game VALUES('2025-12-15T22:26:24.856Z','2025-12-15T22:26:27.823Z','019b241f-39d8-71d3-98a7-562906c7fd9f',0,NULL,'active',30,'満員-1765837584197-571790');
INSERT INTO game VALUES('2025-12-23T13:48:52.410Z','2025-12-23T13:49:05.012Z','019b4b78-473c-74aa-80ae-1d09cf220163',0,NULL,'active',30,'誰でも歓迎');
INSERT INTO game VALUES('2025-12-23T13:50:59.924Z','2025-12-23T13:53:14.757Z','019b4b7a-3954-7194-9ab4-9305b6fe88f9',0,NULL,'active',30,'誰でも歓迎');
CREATE TABLE IF NOT EXISTS `player` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`game_token_hash` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_name` text NOT NULL,
	`seat` integer NOT NULL,
	`user_id` text, `is_cpu` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
INSERT INTO player VALUES('2025-12-15T22:26:24.882Z','2025-12-15T22:26:24.882Z','019b241f-39d8-71d3-98a7-562906c7fd9f','f5988c730012249b813f7048f6c8b112aa7a49c3089fae8abe9088d8cfb236c0','019b241f-39f2-78f0-8821-7831ac15278b','プレイヤー-1765837584197-933056',1,NULL,0);
INSERT INTO player VALUES('2025-12-15T22:26:25.886Z','2025-12-15T22:26:25.886Z','019b241f-39d8-71d3-98a7-562906c7fd9f','a37826e50243063c3c62b6fb5a8506455144ea1d5215bc1cd421739d2b787f04','019b241f-3dde-7223-a6dc-e7ccd5cd7d1e','参加者B-1765837584197-136330',2,NULL,0);
INSERT INTO player VALUES('2025-12-15T22:26:26.833Z','2025-12-15T22:26:26.833Z','019b241f-39d8-71d3-98a7-562906c7fd9f','27079ab72c6a81d7446bb20225d42547b39c51d568e2e3afd51b62cca2ec9786','019b241f-4191-7f38-ae8c-000ed482cae8','参加者C-1765837584197-868624',3,NULL,0);
INSERT INTO player VALUES('2025-12-15T22:26:27.797Z','2025-12-15T22:26:27.797Z','019b241f-39d8-71d3-98a7-562906c7fd9f','20aa32d812d4382b86dcc9bc41ade3e56b72b55e9da8827d43b9bc5769140d15','019b241f-4555-791f-8542-51c175de62af','参加者D-1765837584197-997104',4,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:48:52.442Z','2025-12-23T13:48:52.442Z','019b4b78-473c-74aa-80ae-1d09cf220163','7ecb93c73a8adccd0fb62ccb1fb897a7d5744cbae4f93cd845811cb443bd0d5a','019b4b78-475a-73f2-9e9c-d0d65ed43cc0','匿名プレイヤー',1,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:49:01.346Z','2025-12-23T13:49:01.346Z','019b4b78-473c-74aa-80ae-1d09cf220163','03b35b6b4fa8f672dd72ceecfac66c80a644eb2fd86c20fc0204157ea835a379','019b4b78-6a22-73fa-8a53-543c7a6a43e0','匿名プレイヤー',2,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:49:04.954Z','2025-12-23T13:49:04.954Z','019b4b78-473c-74aa-80ae-1d09cf220163','f2bc36b8fec1e15a249d98ba50e51dac51395d86ec2018b654758aca3e758741','019b4b78-783a-747c-9ca9-f199193816c2','CPU ',3,NULL,1);
INSERT INTO player VALUES('2025-12-23T13:49:04.984Z','2025-12-23T13:49:04.984Z','019b4b78-473c-74aa-80ae-1d09cf220163','1755b0ec8cfb39d0283426610035b06b77d147cbc8cea103b3afa94a7530654b','019b4b78-7858-7d1b-86c3-dd1071ea2fd9','CPU ',4,NULL,1);
INSERT INTO player VALUES('2025-12-23T13:51:00.009Z','2025-12-23T13:51:00.009Z','019b4b7a-3954-7194-9ab4-9305b6fe88f9','92d50474247561e4b0787c5ace47b3416a9704ee1814f4539e00263a1b3b7f01','019b4b7a-39a9-7941-ad15-30a1e72a8c7c','匿名プレイヤー',1,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:51:05.873Z','2025-12-23T13:51:05.873Z','019b4b7a-3954-7194-9ab4-9305b6fe88f9','ae2c1a29c738ae540d107716dd8c8b16b0d31375dfdfabcaffe39b517b7ba3dc','019b4b7a-5091-7e31-8a9a-b4021b6d3926','匿名プレイヤー',2,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:53:09.105Z','2025-12-23T13:53:09.105Z','019b4b7a-3954-7194-9ab4-9305b6fe88f9','53e26cc332c727fde16102f784c83f4bd3d9e83099367465748e25544413f982','019b4b7c-31f1-7587-8628-60338723bed1','匿名プレイヤー',3,NULL,0);
INSERT INTO player VALUES('2025-12-23T13:53:14.722Z','2025-12-23T13:53:14.722Z','019b4b7a-3954-7194-9ab4-9305b6fe88f9','3ff32d6f670cc5d7622ca4b103f37cffd9a4572c79dd33a97b29d5c46e2ea007','019b4b7c-47e2-7ecd-a04a-717956843a53','匿名プレイヤー',4,NULL,0);
CREATE TABLE IF NOT EXISTS `player_card` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	`submission_id` text NOT NULL, `text` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`submission_id`) REFERENCES `submission`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`game_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_no` integer NOT NULL,
	`status` text DEFAULT 'submitting' NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `game`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round_theme` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL, `text` text NOT NULL,
	FOREIGN KEY (`round_id`) REFERENCES `round`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS `round_winner` (
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`round_id` text NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `player`(`id`) ON UPDATE no action ON DELETE cascade,
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
INSERT INTO user VALUES('2025-12-15T22:27:17.398Z','2025-12-15T22:27:17.398Z','sendokakeru.js@gmail.com','019b2420-0716-7baa-9dbb-55499bc04807','https://lh3.googleusercontent.com/a/ACg8ocKeQxeF-cdkdy99r10cKGG6p04KHTOGUhCcGXEZiuGHutxwXw=s96-c','kakeru sendo','active','6714ca98-80f1-7077-3f01-5c5a3db73b1b');
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
CREATE UNIQUE INDEX `player_card_text_unique` ON `player_card` (`text`);
CREATE UNIQUE INDEX `round_theme_text_unique` ON `round_theme` (`text`);
COMMIT;
