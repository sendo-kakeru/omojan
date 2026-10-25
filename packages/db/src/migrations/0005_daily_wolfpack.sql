ALTER TABLE `player` ADD `is_winner` integer DEFAULT false NOT NULL;
--> statement-breakpoint
WITH submission_votes AS (
  SELECT s.`id` AS submission_id, s.`player_id`, s.`round_id`, count(v.`id`) AS vote_count
  FROM `submission` s
  LEFT JOIN `vote` v ON v.`submission_id` = s.`id`
  GROUP BY s.`id`
),
round_max AS (
  SELECT `round_id`, max(vote_count) AS max_vote_count
  FROM submission_votes
  GROUP BY `round_id`
),
player_win_counts AS (
  SELECT sv.`player_id`, count(*) AS win_count
  FROM submission_votes sv
  JOIN round_max rm ON rm.`round_id` = sv.`round_id`
  WHERE rm.max_vote_count > 0 AND sv.vote_count = rm.max_vote_count
  GROUP BY sv.`player_id`
),
game_max AS (
  SELECT p.`game_id`, max(pwc.win_count) AS max_win_count
  FROM player_win_counts pwc
  JOIN `player` p ON p.`id` = pwc.`player_id`
  GROUP BY p.`game_id`
)
UPDATE `player`
SET `is_winner` = 1
WHERE `id` IN (
  SELECT pwc.`player_id`
  FROM player_win_counts pwc
  JOIN `player` p ON p.`id` = pwc.`player_id`
  JOIN `game_max` gm ON gm.`game_id` = p.`game_id`
  JOIN `game` g ON g.`id` = p.`game_id`
  WHERE g.`status` = 'finished' AND pwc.win_count = gm.max_win_count
);
