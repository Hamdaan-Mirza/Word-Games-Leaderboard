export type ScoringType = "ATTEMPTS_LOWER_BETTER" | "POINTS_HIGHER_BETTER";

export interface GameConfig {
  id: string;
  slug: string;
  name: string;
  scoring_type: ScoringType;
  min_score: number;
  max_score: number;
  is_active: boolean;
  description?: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  invite_code: string;
  timezone: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_color: string;
  group_id: string;
  invite_code: string;
  role: "admin" | "member";
}

export interface Submission {
  id: string;
  group_id: string;
  user_id: string;
  game_id: string;
  play_date: string; // YYYY-MM-DD in SAST (or group timezone)
  raw_score: number | null; // null when is_failed = true
  is_failed: boolean;
  normalized_score: number; // 0.00 to 100.00
  updated_at: string;
}

export interface SubmissionAuditLog {
  id: string;
  submission_id: string;
  user_id: string;
  display_name: string;
  game_name: string;
  previous_raw_score: number | null;
  previous_is_failed: boolean;
  previous_normalized_score: number;
  new_raw_score: number | null;
  new_is_failed: boolean;
  new_normalized_score: number;
  changed_at: string;
}

export interface DailyLeaderboardRow {
  play_date: string;
  group_id: string;
  user_id: string;
  display_name: string;
  avatar_color: string;
  games_played: number;
  total_active_games: number;
  total_daily_score: number;
  avg_game_score: number;
  daily_rank: number;
  previous_rank?: number; // For ▲ / ▼ rank change indicator
  submissions_by_game: Record<
    string,
    {
      raw_score: number | null;
      is_failed: boolean;
      normalized_score: number;
    }
  >;
}

export interface SpecialtyBadge {
  slug: string;
  label: string;
  description: string;
}

export interface AllTimeLeaderboardRow {
  group_id: string;
  user_id: string;
  display_name: string;
  avatar_color: string;
  total_games_logged: number;
  days_active: number;
  cumulative_normalized_score: number;
  career_average_score: number;
  win_rate_pct: number; // % of non-failed games
  daily_crowns_won: number; // Only completed days prior to today SAST
  active_streak: number;
  specialty_badges: SpecialtyBadge[];
  all_time_rank: number;
}

