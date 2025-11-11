-- D1 initial schema
PRAGMA foreign_keys = ON;

CREATE TABLE user (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        email TEXT NOT NULL UNIQUE,
        image TEXT,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated')),
        sub TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE game (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        is_private INTEGER NOT NULL DEFAULT 0,
        password TEXT,
        status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
        time_limit INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE round (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        game_id TEXT NOT NULL REFERENCES game(id) ON DELETE CASCADE,
        round_no INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitting' CHECK (status IN ('submitting', 'voting', 'closed')),
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE word (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        text TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE player (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        game_id TEXT NOT NULL REFERENCES game(id) ON DELETE CASCADE,
        game_token_hash TEXT NOT NULL UNIQUE,
        is_host INTEGER NOT NULL DEFAULT 0,
        player_name TEXT NOT NULL,
        seat INTEGER NOT NULL CHECK (seat BETWEEN 1 AND 4),
        user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE submission (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
        position TEXT NOT NULL CHECK (position IN ('prefix', 'suffix')),
        round_id TEXT NOT NULL REFERENCES round(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE player_card (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
        round_id TEXT NOT NULL REFERENCES round(id) ON DELETE CASCADE,
        submission_id TEXT NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
        word_id TEXT NOT NULL REFERENCES word(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE round_theme (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        round_id TEXT NOT NULL REFERENCES round(id) ON DELETE CASCADE,
        word_id TEXT NOT NULL REFERENCES word(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE round_winner (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
        round_id TEXT NOT NULL REFERENCES round(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE TABLE vote (
        id TEXT PRIMARY KEY NOT NULL DEFAULT (
                lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
                '4' || substr(lower(hex(randomblob(2))), 2) || '-' ||
                substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' ||
                lower(hex(randomblob(6)))
        ),
        player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
        round_id TEXT NOT NULL REFERENCES round(id) ON DELETE CASCADE,
        submission_id TEXT NOT NULL REFERENCES submission(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);
