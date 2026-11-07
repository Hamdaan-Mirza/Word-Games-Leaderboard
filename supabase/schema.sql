-- ==============================================================================
-- Word Games Hub & Leaderboard - Production PostgreSQL Schema & Normalization DDL
-- Compatible with Supabase PostgreSQL (100% Free Tier, RLS, CDC Realtime)
-- Default Timezone: Africa/Johannesburg (GMT+2 / SAST)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (syncs or links to auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_color TEXT NOT NULL DEFAULT '#1D4ED8',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Groups Table (Private Friend Groups & Multi-Group Isolation)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Group Members Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. Games Configuration Table (Game Registry)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'wordle', 'word500', 'krillion', etc.
    name TEXT NOT NULL,
    scoring_type TEXT NOT NULL CHECK (scoring_type IN ('ATTEMPTS_LOWER_BETTER', 'POINTS_HIGHER_BETTER')),
    min_score INT NOT NULL,
    max_score INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. Daily Submissions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    play_date DATE NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Johannesburg')::DATE,
    raw_score INT, -- NULL if failed (X) on attempt-based games
    is_failed BOOLEAN NOT NULL DEFAULT false,
    normalized_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, game_id, play_date)
);

-- -----------------------------------------------------------------------------
-- 6. Submission Audit Trail Table (UC-05: keep friends honest on same-day edits)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    previous_raw_score INT,
    previous_is_failed BOOLEAN,
    previous_normalized_score NUMERIC(5,2),
    new_raw_score INT,
    new_is_failed BOOLEAN,
    new_normalized_score NUMERIC(5,2),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. Trigger 1 (BEFORE INSERT OR UPDATE): Normalization Engine & Anti-Cheat
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_normalize_submission()
RETURNS TRIGGER AS $$
DECLARE
    v_game RECORD;
    v_group_tz TEXT := 'Africa/Johannesburg';
    v_today DATE;
BEGIN
    -- Fetch the game configuration
    SELECT * INTO v_game FROM games WHERE id = NEW.game_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Game not found with ID %', NEW.game_id;
    END IF;

    -- Resolve group timezone (defaulting to Africa/Johannesburg GMT+2)
    IF NEW.group_id IS NOT NULL THEN
        SELECT COALESCE(timezone, 'Africa/Johannesburg') INTO v_group_tz FROM groups WHERE id = NEW.group_id;
    END IF;
    v_today := (CURRENT_TIMESTAMP AT TIME ZONE v_group_tz)::DATE;

    -- Enforce Edit Window Cutoff: Cannot edit past dates after midnight local time
    IF TG_OP = 'UPDATE' AND OLD.play_date < v_today THEN
        RAISE EXCEPTION 'Scores for past dates (%) cannot be modified after midnight cutoff.', OLD.play_date;
    END IF;

    -- Refinement 4: Explicit scoring_type vs is_failed / raw_score nullability checks
    IF v_game.scoring_type = 'POINTS_HIGHER_BETTER' THEN
        IF NEW.is_failed = TRUE THEN
            RAISE EXCEPTION 'Points-based game (%) cannot have is_failed = true. Enter 0 for zero points.', v_game.name;
        END IF;
        IF NEW.raw_score IS NULL THEN
            RAISE EXCEPTION 'raw_score cannot be NULL for points-based game (%).', v_game.name;
        END IF;
        IF NEW.raw_score < v_game.min_score OR NEW.raw_score > v_game.max_score THEN
            RAISE EXCEPTION 'Score % is out of bounds for % (must be between % and %).',
                NEW.raw_score, v_game.name, v_game.min_score, v_game.max_score;
        END IF;
    ELSIF v_game.scoring_type = 'ATTEMPTS_LOWER_BETTER' THEN
        IF NEW.is_failed = TRUE THEN
            NEW.raw_score := NULL;
        ELSE
            IF NEW.raw_score IS NULL THEN
                RAISE EXCEPTION 'raw_score cannot be NULL when is_failed is false for %.', v_game.name;
            END IF;
            IF NEW.raw_score < v_game.min_score OR NEW.raw_score > v_game.max_score THEN
                RAISE EXCEPTION 'Attempt count % is out of bounds for % (must be between % and %, or failed X).',
                    NEW.raw_score, v_game.name, v_game.min_score, v_game.max_score;
            END IF;
        END IF;
    END IF;

    -- Compute Deterministic 0.00 - 100.00 Normalized Score
    IF NEW.is_failed = TRUE THEN
        NEW.normalized_score := 10.00; -- Flat participation credit to reward playing vs skipping
    ELSE
        IF v_game.slug = 'wordle' THEN
            CASE NEW.raw_score
                WHEN 1 THEN NEW.normalized_score := 100.00;
                WHEN 2 THEN NEW.normalized_score := 90.00;
                WHEN 3 THEN NEW.normalized_score := 80.00;
                WHEN 4 THEN NEW.normalized_score := 65.00;
                WHEN 5 THEN NEW.normalized_score := 50.00;
                WHEN 6 THEN NEW.normalized_score := 35.00;
                ELSE NEW.normalized_score := 10.00;
            END CASE;

        ELSIF v_game.slug = 'word500' THEN
            -- Formula: 100 - ((attempts - 1) * 11)
            NEW.normalized_score := ROUND(100.00 - ((NEW.raw_score - 1) * 11.00), 2);

        ELSIF v_game.slug = 'krillion' THEN
            -- Formula: ROUND((raw_score / 700.0) * 100, 2)
            NEW.normalized_score := ROUND((NEW.raw_score::NUMERIC / 700.00) * 100.00, 2);

        ELSE
            -- Dynamic Admin-Configured Games (UC-06)
            IF v_game.scoring_type = 'POINTS_HIGHER_BETTER' THEN
                IF v_game.max_score = v_game.min_score THEN
                    NEW.normalized_score := 100.00;
                ELSE
                    NEW.normalized_score := ROUND(
                        ((NEW.raw_score - v_game.min_score)::NUMERIC / (v_game.max_score - v_game.min_score)::NUMERIC) * 100.00,
                        2
                    );
                END IF;
            ELSE -- ATTEMPTS_LOWER_BETTER
                IF v_game.max_score = v_game.min_score THEN
                    NEW.normalized_score := 100.00;
                ELSE
                    NEW.normalized_score := ROUND(
                        100.00 - (((NEW.raw_score - v_game.min_score)::NUMERIC / (v_game.max_score - v_game.min_score)::NUMERIC) * 75.00),
                        2
                    );
                END IF;
            END IF;
        END IF;
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_submission ON submissions;
CREATE TRIGGER trg_normalize_submission
BEFORE INSERT OR UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION trg_fn_normalize_submission();

-- -----------------------------------------------------------------------------
-- 8. Trigger 2 (AFTER UPDATE): Audit Trail Logging (Refinement 3, UC-05)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_fn_audit_submission_edit()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.raw_score IS DISTINCT FROM NEW.raw_score) OR (OLD.is_failed IS DISTINCT FROM NEW.is_failed) THEN
        INSERT INTO submission_audit_logs (
            submission_id,
            user_id,
            previous_raw_score,
            previous_is_failed,
            previous_normalized_score,
            new_raw_score,
            new_is_failed,
            new_normalized_score,
            changed_at
        ) VALUES (
            NEW.id,
            NEW.user_id,
            OLD.raw_score,
            OLD.is_failed,
            OLD.normalized_score,
            NEW.raw_score,
            NEW.is_failed,
            NEW.normalized_score,
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_submission_edit ON submissions;
CREATE TRIGGER trg_audit_submission_edit
AFTER UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_submission_edit();

-- -----------------------------------------------------------------------------
-- 9. Daily Leaderboard View (Equal Weighting, Composite & Mean per Game)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW daily_leaderboard AS
SELECT
    s.play_date,
    s.group_id,
    s.user_id,
    COALESCE(p.display_name, u.raw_user_meta_data->>'display_name', 'Anonymous Player') AS display_name,
    COALESCE(p.avatar_color, '#1D4ED8') AS avatar_color,
    COUNT(s.game_id) AS games_played,
    SUM(s.normalized_score) AS total_daily_score,
    ROUND(AVG(s.normalized_score), 2) AS avg_game_score,
    DENSE_RANK() OVER (
        PARTITION BY s.play_date, s.group_id
        ORDER BY SUM(s.normalized_score) DESC, COUNT(s.game_id) DESC
    ) AS daily_rank
FROM submissions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN profiles p ON p.id = s.user_id
GROUP BY s.play_date, s.group_id, s.user_id, p.display_name, p.avatar_color, u.raw_user_meta_data;

-- -----------------------------------------------------------------------------
-- 10. All-Time Leaderboard View (Refinement 2: Completed-Day Crowns Only)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW all_time_leaderboard AS
WITH completed_daily_winners AS (
    SELECT
        dl.play_date,
        dl.group_id,
        dl.user_id
    FROM daily_leaderboard dl
    LEFT JOIN groups g ON g.id = dl.group_id
    WHERE dl.daily_rank = 1
      AND dl.play_date < (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(g.timezone, 'Africa/Johannesburg'))::DATE
),
user_crowns AS (
    SELECT
        group_id,
        user_id,
        COUNT(play_date) AS daily_crowns_won
    FROM completed_daily_winners
    GROUP BY group_id, user_id
)
SELECT
    s.group_id,
    s.user_id,
    COALESCE(p.display_name, u.raw_user_meta_data->>'display_name', 'Anonymous Player') AS display_name,
    COALESCE(p.avatar_color, '#1D4ED8') AS avatar_color,
    COUNT(s.id) AS total_games_logged,
    COUNT(DISTINCT s.play_date) AS days_active,
    SUM(s.normalized_score) AS cumulative_normalized_score,
    ROUND(AVG(s.normalized_score), 2) AS career_average_score,
    COALESCE(c.daily_crowns_won, 0) AS daily_crowns_won,
    DENSE_RANK() OVER (
        PARTITION BY s.group_id
        ORDER BY SUM(s.normalized_score) DESC
    ) AS all_time_rank
FROM submissions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN profiles p ON p.id = s.user_id
LEFT JOIN user_crowns c ON c.user_id = s.user_id AND (c.group_id IS NOT DISTINCT FROM s.group_id)
GROUP BY s.group_id, s.user_id, p.display_name, p.avatar_color, u.raw_user_meta_data, c.daily_crowns_won;

-- -----------------------------------------------------------------------------
-- 11. Row-Level Security (RLS) Policies (NFR-5)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage games" ON games FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage groups" ON groups FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Users can insert own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON submissions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can view audit logs" ON submission_audit_logs FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 12. Supabase Realtime CDC Publication (Refinement 1: Base Tables Only)
-- -----------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE submission_audit_logs;
