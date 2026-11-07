-- ==============================================================================
-- Seed Data for Word Games Hub & Leaderboard
-- Games: Wordle, Word500, Krillion
-- Default Friend Group: WORDS2026 (Africa/Johannesburg GMT+2)
-- ==============================================================================

-- 1. Seed Core Games
INSERT INTO games (id, slug, name, scoring_type, min_score, max_score, is_active)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'wordle', 'Wordle', 'ATTEMPTS_LOWER_BETTER', 1, 6, true),
    ('a0000000-0000-0000-0000-000000000002', 'word500', 'Word500', 'ATTEMPTS_LOWER_BETTER', 1, 8, true),
    ('a0000000-0000-0000-0000-000000000003', 'krillion', 'Krillion', 'POINTS_HIGHER_BETTER', 0, 700, true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    scoring_type = EXCLUDED.scoring_type,
    min_score = EXCLUDED.min_score,
    max_score = EXCLUDED.max_score,
    is_active = EXCLUDED.is_active;

-- 2. Seed Default Friend Group
INSERT INTO groups (id, name, invite_code, timezone)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Daily Word Warriors', 'WORDS2026', 'Africa/Johannesburg')
ON CONFLICT (invite_code) DO UPDATE SET
    name = EXCLUDED.name,
    timezone = EXCLUDED.timezone;
