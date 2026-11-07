import {
  AllTimeLeaderboardRow,
  DailyLeaderboardRow,
  GameConfig,
  GroupInfo,
  ScoringType,
  SpecialtyBadge,
  Submission,
  SubmissionAuditLog,
  UserProfile,
} from "@/types/leaderboard";
import { calculateNormalizedScore } from "@/lib/normalization";
import { DEFAULT_TIMEZONE, getLocalDateString, getOffsetDateString } from "@/lib/timezone";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./client";

const STORAGE_KEYS = {
  GAMES: "wgl_games_v3",
  SUBMISSIONS: "wgl_submissions_v3",
  AUDIT_LOGS: "wgl_audit_logs_v3",
  PROFILES: "wgl_profiles_v3",
  CURRENT_USER: "wgl_current_user_v3",
  GROUP: "wgl_group_v3",
};

const BROADCAST_CHANNEL_NAME = "word_games_realtime_cdc";

export const DEFAULT_GROUP: GroupInfo = {
  id: "b0000000-0000-0000-0000-000000000001",
  name: "Daily Word Warriors",
  invite_code: "WORDS2026",
  timezone: DEFAULT_TIMEZONE,
};

export const SEED_GAMES: GameConfig[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    slug: "wordle",
    name: "Wordle",
    scoring_type: "ATTEMPTS_LOWER_BETTER",
    min_score: 1,
    max_score: 6,
    is_active: true,
    description: "Deduce the 5-letter word in 1–6 tries (or X/fail).",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    slug: "word500",
    name: "Word500",
    scoring_type: "ATTEMPTS_LOWER_BETTER",
    min_score: 1,
    max_score: 8,
    is_active: true,
    description: "Count-only feedback word deduction in 1–8 tries (or X/fail).",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    slug: "krillion",
    name: "Krillion",
    scoring_type: "POINTS_HIGHER_BETTER",
    min_score: 0,
    max_score: 700,
    is_active: true,
    description: "7 timed prompts (0–700 pts, 1 pt = 10m depth).",
  },
];

// Used only for offline automated unit tests
export const SEED_PROFILES: UserProfile[] = [
  {
    id: "u0000000-0000-0000-0000-000000000001",
    display_name: "Player 1",
    avatar_color: "#1D2D44",
    group_id: DEFAULT_GROUP.id,
    invite_code: DEFAULT_GROUP.invite_code,
    role: "admin",
  },
  {
    id: "u0000000-0000-0000-0000-000000000002",
    display_name: "Thabo M.",
    avatar_color: "#047857",
    group_id: DEFAULT_GROUP.id,
    invite_code: DEFAULT_GROUP.invite_code,
    role: "member",
  },
  {
    id: "u0000000-0000-0000-0000-000000000003",
    display_name: "Naledi K.",
    avatar_color: "#B45309",
    group_id: DEFAULT_GROUP.id,
    invite_code: DEFAULT_GROUP.invite_code,
    role: "member",
  },
  {
    id: "u0000000-0000-0000-0000-000000000004",
    display_name: "Liam V.",
    avatar_color: "#3E5C76",
    group_id: DEFAULT_GROUP.id,
    invite_code: DEFAULT_GROUP.invite_code,
    role: "member",
  },
  {
    id: "u0000000-0000-0000-0000-000000000005",
    display_name: "Zanele D.",
    avatar_color: "#BE123C",
    group_id: DEFAULT_GROUP.id,
    invite_code: DEFAULT_GROUP.invite_code,
    role: "member",
  },
];

function buildInitialSeedSubmissions(): Submission[] {
  const today = getLocalDateString();
  const dayMinus1 = getOffsetDateString(-1);
  const dayMinus2 = getOffsetDateString(-2);
  const dayMinus3 = getOffsetDateString(-3);

  const wordle = SEED_GAMES[0];
  const word500 = SEED_GAMES[1];
  const krillion = SEED_GAMES[2];

  const rows: Array<{
    user_id: string;
    game: GameConfig;
    play_date: string;
    raw_score: number | null;
    is_failed: boolean;
  }> = [
    { user_id: SEED_PROFILES[0].id, game: wordle, play_date: dayMinus3, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: word500, play_date: dayMinus3, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: krillion, play_date: dayMinus3, raw_score: 510, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: wordle, play_date: dayMinus3, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: word500, play_date: dayMinus3, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: krillion, play_date: dayMinus3, raw_score: 480, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: wordle, play_date: dayMinus3, raw_score: 2, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: word500, play_date: dayMinus3, raw_score: 5, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: krillion, play_date: dayMinus3, raw_score: 420, is_failed: false },

    { user_id: SEED_PROFILES[0].id, game: wordle, play_date: dayMinus2, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: word500, play_date: dayMinus2, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: krillion, play_date: dayMinus2, raw_score: 540, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: wordle, play_date: dayMinus2, raw_score: 2, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: word500, play_date: dayMinus2, raw_score: 2, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: krillion, play_date: dayMinus2, raw_score: 610, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: wordle, play_date: dayMinus2, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: word500, play_date: dayMinus2, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: krillion, play_date: dayMinus2, raw_score: 495, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: wordle, play_date: dayMinus2, raw_score: 5, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: word500, play_date: dayMinus2, raw_score: null, is_failed: true },
    { user_id: SEED_PROFILES[3].id, game: krillion, play_date: dayMinus2, raw_score: 390, is_failed: false },

    { user_id: SEED_PROFILES[0].id, game: wordle, play_date: dayMinus1, raw_score: 2, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: word500, play_date: dayMinus1, raw_score: 2, is_failed: false },
    { user_id: SEED_PROFILES[0].id, game: krillion, play_date: dayMinus1, raw_score: 630, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: wordle, play_date: dayMinus1, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: word500, play_date: dayMinus1, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: krillion, play_date: dayMinus1, raw_score: 525, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: wordle, play_date: dayMinus1, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: word500, play_date: dayMinus1, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: krillion, play_date: dayMinus1, raw_score: 645, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: wordle, play_date: dayMinus1, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: word500, play_date: dayMinus1, raw_score: 5, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: krillion, play_date: dayMinus1, raw_score: 470, is_failed: false },
    { user_id: SEED_PROFILES[4].id, game: wordle, play_date: dayMinus1, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[4].id, game: word500, play_date: dayMinus1, raw_score: 6, is_failed: false },
    { user_id: SEED_PROFILES[4].id, game: krillion, play_date: dayMinus1, raw_score: 505, is_failed: false },

    { user_id: SEED_PROFILES[1].id, game: wordle, play_date: today, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[1].id, game: krillion, play_date: today, raw_score: 467, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: wordle, play_date: today, raw_score: 3, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: word500, play_date: today, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[2].id, game: krillion, play_date: today, raw_score: 552, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: wordle, play_date: today, raw_score: 4, is_failed: false },
    { user_id: SEED_PROFILES[3].id, game: word500, play_date: today, raw_score: 5, is_failed: false },
    { user_id: SEED_PROFILES[4].id, game: word500, play_date: today, raw_score: 2, is_failed: false },
  ];

  return rows.map((r, idx) => {
    const calc = calculateNormalizedScore(r.game, r.raw_score, r.is_failed);
    return {
      id: `sub-seed-${idx + 1}`,
      group_id: DEFAULT_GROUP.id,
      user_id: r.user_id,
      game_id: r.game.id,
      play_date: r.play_date,
      raw_score: calc.sanitizedRawScore,
      is_failed: r.is_failed,
      normalized_score: calc.normalizedScore,
      updated_at: new Date(Date.now() - (rows.length - idx) * 60000).toISOString(),
    };
  });
}

function ensureLocalStoreInitialized(): void {
  if (typeof window === "undefined") return;

  // Purge all legacy v1 and v2 demo keys (including "You (Alex)" and simulated scores)
  [
    "wgl_games_v1",
    "wgl_submissions_v1",
    "wgl_audit_logs_v1",
    "wgl_profiles_v1",
    "wgl_current_user_v1",
    "wgl_group_v1",
    "wgl_games_v2",
    "wgl_submissions_v2",
    "wgl_audit_logs_v2",
    "wgl_profiles_v2",
    "wgl_current_user_v2",
    "wgl_group_v2",
  ].forEach((legacyKey) => localStorage.removeItem(legacyKey));

  if (!localStorage.getItem(STORAGE_KEYS.GROUP)) {
    localStorage.setItem(STORAGE_KEYS.GROUP, JSON.stringify(DEFAULT_GROUP));
  }
  if (!localStorage.getItem(STORAGE_KEYS.GAMES)) {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(SEED_GAMES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROFILES)) {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([SEED_PROFILES[0]]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(SEED_PROFILES[0]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
  }
}

function broadcastLocalChange(eventType: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("wgl-realtime-update", { detail: { eventType } }));
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ eventType, timestamp: Date.now() });
      channel.close();
    } catch {
      // Ignore BroadcastChannel errors
    }
  }
}

/**
 * Resolves a human-readable display name from a Supabase auth user object
 * (supports custom metadata, Google OAuth `full_name` / `name`, and email prefix).
 */
function extractAuthDisplayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata || {};
  const candidates = [
    meta.display_name,
    meta.full_name,
    meta.name,
    meta.user_name,
    meta.preferred_username,
    user.email ? user.email.split("@")[0] : null,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) {
      return c.trim();
    }
  }
  return "Player";
}

// ============================================================================
// Repository Public API
// ============================================================================

export async function getActiveGroup(): Promise<GroupInfo> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      const { data } = await sb
        .from("groups")
        .select("*")
        .eq("invite_code", process.env.NEXT_PUBLIC_DEFAULT_GROUP_CODE || "WORDS2026")
        .maybeSingle();
      if (data) return data as GroupInfo;
    } catch {
      // Fallback to default group
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return DEFAULT_GROUP;
  const raw = localStorage.getItem(STORAGE_KEYS.GROUP);
  return raw ? (JSON.parse(raw) as GroupInfo) : DEFAULT_GROUP;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const resolvedName =
          profile?.display_name && profile.display_name !== "Player"
            ? profile.display_name
            : extractAuthDisplayName(user);
        const resolvedColor =
          profile?.avatar_color ||
          (typeof user.user_metadata?.avatar_color === "string"
            ? user.user_metadata.avatar_color
            : "#1D2D44");

        // Automatically sync the user's profile row into `profiles` if missing or outdated
        if (!profile || profile.display_name !== resolvedName) {
          await sb.from("profiles").upsert({
            id: user.id,
            display_name: resolvedName,
            avatar_color: resolvedColor,
            updated_at: new Date().toISOString(),
          });
        }

        return {
          id: user.id,
          display_name: resolvedName,
          avatar_color: resolvedColor,
          group_id: DEFAULT_GROUP.id,
          invite_code: DEFAULT_GROUP.invite_code,
          role: "admin",
        };
      }
    } catch {
      // Fallback if unauthenticated
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return SEED_PROFILES[0];
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return raw ? (JSON.parse(raw) as UserProfile) : SEED_PROFILES[0];
}

export async function updateCurrentUserProfile(updates: {
  display_name: string;
  avatar_color: string;
  invite_code?: string;
}): Promise<UserProfile> {
  const current = await getCurrentUser();
  const cleanName = updates.display_name.trim() || current.display_name;
  const cleanColor = updates.avatar_color || current.avatar_color;
  const cleanCode = (updates.invite_code || current.invite_code).toUpperCase();

  const updated: UserProfile = {
    ...current,
    display_name: cleanName,
    avatar_color: cleanColor,
    invite_code: cleanCode,
  };

  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (user) {
        await Promise.all([
          sb.from("profiles").upsert({
            id: user.id,
            display_name: cleanName,
            avatar_color: cleanColor,
            updated_at: new Date().toISOString(),
          }),
          sb.auth.updateUser({
            data: {
              display_name: cleanName,
              avatar_color: cleanColor,
              invite_code: cleanCode,
            },
          }),
        ]);
      }
    } catch {
      // Ignore if unauthenticated
    }
  }

  if (typeof window !== "undefined") {
    ensureLocalStoreInitialized();
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
    const profiles = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]"
    ) as UserProfile[];
    const idx = profiles.findIndex((p) => p.id === updated.id);
    if (idx >= 0) {
      profiles[idx] = updated;
    } else {
      profiles.push(updated);
    }
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
    broadcastLocalChange("profile_updated");
  }

  return updated;
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    try {
      const [{ data: remoteProfiles }, { data: viewRows }] = await Promise.all([
        sb.from("profiles").select("*"),
        sb.from("all_time_leaderboard").select("user_id, display_name, avatar_color, group_id"),
      ]);

      const map = new Map<string, UserProfile>();

      if (viewRows) {
        for (const vr of viewRows) {
          map.set(vr.user_id, {
            id: vr.user_id,
            display_name: vr.display_name || "Player",
            avatar_color: vr.avatar_color || "#1D2D44",
            group_id: vr.group_id || DEFAULT_GROUP.id,
            invite_code: DEFAULT_GROUP.invite_code,
            role: "member",
          });
        }
      }

      if (remoteProfiles) {
        for (const rp of remoteProfiles) {
          map.set(rp.id, {
            id: rp.id,
            display_name: rp.display_name || map.get(rp.id)?.display_name || "Player",
            avatar_color: rp.avatar_color || "#1D2D44",
            group_id: DEFAULT_GROUP.id,
            invite_code: DEFAULT_GROUP.invite_code,
            role: "member",
          });
        }
      }

      if (map.size > 0) {
        return Array.from(map.values());
      }
    } catch {
      // Fallback to local
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return [SEED_PROFILES[0]];
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || "[]") as UserProfile[];
}

export async function switchDemoPersona(userId: string): Promise<UserProfile> {
  const profiles = await getAllProfiles();
  const target = profiles.find((p) => p.id === userId) || profiles[0];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(target));
    broadcastLocalChange("persona_switched");
  }
  return target;
}

export async function getGames(includeInactive = false): Promise<GameConfig[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      let query = sb.from("games").select("*").order("created_at", { ascending: true });
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      const { data } = await query;
      if (data && data.length > 0) return data as GameConfig[];
    } catch {
      // Fallback to local
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return SEED_GAMES;
  const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || "[]") as GameConfig[];
  return includeInactive ? all : all.filter((g) => g.is_active);
}

export async function addOrUpdateGame(input: {
  slug: string;
  name: string;
  scoring_type: ScoringType;
  min_score: number;
  max_score: number;
  is_active?: boolean;
  description?: string;
}): Promise<{ success: boolean; game?: GameConfig; error?: string }> {
  const cleanSlug = input.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, "-");
  if (!cleanSlug || !input.name.trim()) {
    return { success: false, error: "Game name and slug are required." };
  }
  if (input.min_score < 0 || input.max_score <= input.min_score) {
    return {
      success: false,
      error: "max_score must be greater than min_score (and min_score >= 0).",
    };
  }

  const newGame: GameConfig = {
    id: `game-${cleanSlug}-${Date.now()}`,
    slug: cleanSlug,
    name: input.name.trim(),
    scoring_type: input.scoring_type,
    min_score: Number(input.min_score),
    max_score: Number(input.max_score),
    is_active: input.is_active ?? true,
    description: input.description?.trim(),
  };

  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("games")
      .upsert(
        {
          slug: newGame.slug,
          name: newGame.name,
          scoring_type: newGame.scoring_type,
          min_score: newGame.min_score,
          max_score: newGame.max_score,
          is_active: newGame.is_active,
        },
        { onConflict: "slug" }
      )
      .select()
      .single();
    if (!error && data) {
      return { success: true, game: data as GameConfig };
    }
  }

  ensureLocalStoreInitialized();
  const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || "[]") as GameConfig[];
  const existingIdx = games.findIndex((g) => g.slug === cleanSlug);
  if (existingIdx >= 0) {
    games[existingIdx] = { ...games[existingIdx], ...newGame, id: games[existingIdx].id };
  } else {
    games.push(newGame);
  }
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  broadcastLocalChange("game_configured");
  return { success: true, game: existingIdx >= 0 ? games[existingIdx] : newGame };
}

export async function toggleGameActive(gameId: string, isActive: boolean): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      await sb.from("games").update({ is_active: isActive }).eq("id", gameId);
    } catch {
      // Ignore
    }
  }
  ensureLocalStoreInitialized();
  const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES) || "[]") as GameConfig[];
  const updated = games.map((g) => (g.id === gameId ? { ...g, is_active: isActive } : g));
  localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updated));
  broadcastLocalChange("game_configured");
}

export async function submitScore(params: {
  gameId: string;
  rawScore: number | null;
  isFailed: boolean;
  playDate?: string;
  userId?: string;
}): Promise<{
  success: boolean;
  submission?: Submission;
  isEdit?: boolean;
  error?: string;
}> {
  const group = await getActiveGroup();
  const todaySast = getLocalDateString(new Date(), group.timezone);
  const targetDate = params.playDate || todaySast;

  if (targetDate < todaySast) {
    return {
      success: false,
      error: `The daily edit window for ${targetDate} has closed at 00:00:00 (${group.timezone}).`,
    };
  }

  const allGames = await getGames(true);
  const game = allGames.find((g) => g.id === params.gameId);
  if (!game) {
    return { success: false, error: "Selected game was not found in the registry." };
  }

  const normResult = calculateNormalizedScore(game, params.rawScore, params.isFailed);
  if (!normResult.valid) {
    return { success: false, error: normResult.error };
  }

  const currentUser = await getCurrentUser();
  const effectiveUserId = params.userId || currentUser.id;

  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    const {
      data: { user: authUser },
    } = await sb.auth.getUser();
    if (!authUser) {
      return {
        success: false,
        error: "Please sign in on the Profile / Group page first to save scores to the live leaderboard.",
      };
    }

    const { data, error } = await sb
      .from("submissions")
      .upsert(
        {
          group_id: group.id,
          user_id: authUser.id,
          game_id: game.id,
          play_date: targetDate,
          raw_score: normResult.sanitizedRawScore,
          is_failed: params.isFailed,
          normalized_score: normResult.normalizedScore,
        },
        { onConflict: "user_id,game_id,play_date" }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    broadcastLocalChange("submission_upserted");
    return { success: true, submission: data as Submission };
  }

  // Local Store Execution (only when Supabase is not configured)
  ensureLocalStoreInitialized();
  const submissions = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || "[]"
  ) as Submission[];

  const existingIdx = submissions.findIndex(
    (s) =>
      s.user_id === effectiveUserId &&
      s.game_id === game.id &&
      s.play_date === targetDate
  );

  let savedSubmission: Submission;
  let isEdit = false;

  if (existingIdx >= 0) {
    const oldSub = submissions[existingIdx];
    isEdit = true;

    savedSubmission = {
      ...oldSub,
      raw_score: normResult.sanitizedRawScore,
      is_failed: params.isFailed,
      normalized_score: normResult.normalizedScore,
      updated_at: new Date().toISOString(),
    };
    submissions[existingIdx] = savedSubmission;

    if (
      oldSub.raw_score !== savedSubmission.raw_score ||
      oldSub.is_failed !== savedSubmission.is_failed
    ) {
      const profiles = await getAllProfiles();
      const actor = profiles.find((p) => p.id === effectiveUserId) || currentUser;
      const auditLogs = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || "[]"
      ) as SubmissionAuditLog[];

      auditLogs.unshift({
        id: `audit-${Date.now()}`,
        submission_id: oldSub.id,
        user_id: effectiveUserId,
        display_name: actor.display_name,
        game_name: game.name,
        previous_raw_score: oldSub.raw_score,
        previous_is_failed: oldSub.is_failed,
        previous_normalized_score: oldSub.normalized_score,
        new_raw_score: savedSubmission.raw_score,
        new_is_failed: savedSubmission.is_failed,
        new_normalized_score: savedSubmission.normalized_score,
        changed_at: savedSubmission.updated_at,
      });
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    }
  } else {
    savedSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group_id: group.id,
      user_id: effectiveUserId,
      game_id: game.id,
      play_date: targetDate,
      raw_score: normResult.sanitizedRawScore,
      is_failed: params.isFailed,
      normalized_score: normResult.normalizedScore,
      updated_at: new Date().toISOString(),
    };
    submissions.push(savedSubmission);
  }

  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  broadcastLocalChange("submission_upserted");

  return { success: true, submission: savedSubmission, isEdit };
}

export async function getUserSubmissionsForDate(
  userId: string,
  playDate: string
): Promise<Submission[]> {
  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    try {
      const { data } = await sb
        .from("submissions")
        .select("*")
        .eq("user_id", userId)
        .eq("play_date", playDate);
      return (data as Submission[]) || [];
    } catch {
      return [];
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return [];
  const submissions = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || "[]"
  ) as Submission[];
  return submissions.filter((s) => s.user_id === userId && s.play_date === playDate);
}

/**
 * Computes the Daily Leaderboard with SQL-identical DENSE_RANK()
 * ORDER BY SUM(normalized_score) DESC, COUNT(game_id) DESC
 */
export async function getDailyLeaderboard(
  playDate?: string
): Promise<DailyLeaderboardRow[]> {
  const group = await getActiveGroup();
  const targetDate = playDate || getLocalDateString(new Date(), group.timezone);
  const activeGames = await getGames(false);
  const totalActiveGames = activeGames.length;

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return [];

  let daySubs: Submission[] = [];
  const profileMap = new Map<string, { display_name: string; avatar_color: string }>();

  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    try {
      // Fetch purely from Supabase (never mix local demo users)
      const [{ data: remoteSubs }, { data: viewRows }, { data: remoteProfiles }] =
        await Promise.all([
          sb.from("submissions").select("*").eq("play_date", targetDate),
          sb.from("daily_leaderboard").select("*").eq("play_date", targetDate),
          sb.from("profiles").select("*"),
        ]);

      daySubs = (remoteSubs as Submission[]) || [];

      if (viewRows) {
        for (const vr of viewRows) {
          profileMap.set(vr.user_id, {
            display_name: vr.display_name || "Player",
            avatar_color: vr.avatar_color || "#1D2D44",
          });
        }
      }
      if (remoteProfiles) {
        for (const rp of remoteProfiles) {
          if (rp.display_name) {
            profileMap.set(rp.id, {
              display_name: rp.display_name,
              avatar_color: rp.avatar_color || "#1D2D44",
            });
          }
        }
      }
    } catch {
      daySubs = [];
    }
  } else {
    const submissions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || "[]"
    ) as Submission[];
    daySubs = submissions.filter((s) => s.play_date === targetDate);
    const localProfiles = await getAllProfiles();
    for (const lp of localProfiles) {
      profileMap.set(lp.id, {
        display_name: lp.display_name,
        avatar_color: lp.avatar_color,
      });
    }
  }

  // Group by user_id
  const userMap = new Map<
    string,
    {
      display_name: string;
      avatar_color: string;
      subs: Submission[];
    }
  >();

  for (const sub of daySubs) {
    const existing = userMap.get(sub.user_id);
    if (existing) {
      existing.subs.push(sub);
    } else {
      const pInfo = profileMap.get(sub.user_id) || {
        display_name: "Player",
        avatar_color: "#1D2D44",
      };
      userMap.set(sub.user_id, {
        display_name: pInfo.display_name,
        avatar_color: pInfo.avatar_color,
        subs: [sub],
      });
    }
  }

  const unrankedRows: Omit<DailyLeaderboardRow, "daily_rank">[] = [];

  for (const [userId, { display_name, avatar_color, subs }] of userMap.entries()) {
    const gamesPlayed = subs.length;
    const totalDailyScore = Number(
      subs.reduce((acc, s) => acc + Number(s.normalized_score), 0).toFixed(2)
    );
    const avgGameScore =
      gamesPlayed > 0 ? Number((totalDailyScore / gamesPlayed).toFixed(2)) : 0;

    const submissionsByGame: DailyLeaderboardRow["submissions_by_game"] = {};
    for (const s of subs) {
      submissionsByGame[s.game_id] = {
        raw_score: s.raw_score,
        is_failed: s.is_failed,
        normalized_score: Number(s.normalized_score),
      };
    }

    unrankedRows.push({
      play_date: targetDate,
      group_id: group.id,
      user_id: userId,
      display_name,
      avatar_color,
      games_played: gamesPlayed,
      total_active_games: totalActiveGames,
      total_daily_score: totalDailyScore,
      avg_game_score: avgGameScore,
      submissions_by_game: submissionsByGame,
    });
  }

  unrankedRows.sort((a, b) => {
    if (b.total_daily_score !== a.total_daily_score) {
      return b.total_daily_score - a.total_daily_score;
    }
    if (b.games_played !== a.games_played) {
      return b.games_played - a.games_played;
    }
    return a.display_name.localeCompare(b.display_name);
  });

  let currentRank = 0;
  let lastScore: number | null = null;
  let lastCount: number | null = null;

  return unrankedRows.map((row) => {
    if (row.total_daily_score !== lastScore || row.games_played !== lastCount) {
      currentRank += 1;
      lastScore = row.total_daily_score;
      lastCount = row.games_played;
    }
    return {
      ...row,
      daily_rank: currentRank,
    };
  });
}

/**
 * Computes the All-Time Hall of Fame Leaderboard (FR-6, UC-04, Refinement 2)
 */
export async function getAllTimeLeaderboard(): Promise<AllTimeLeaderboardRow[]> {
  const group = await getActiveGroup();
  const todaySast = getLocalDateString(new Date(), group.timezone);
  const yesterdaySast = getOffsetDateString(-1, new Date(), group.timezone);

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return [];

  let submissions: Submission[] = [];
  const profileMap = new Map<string, { display_name: string; avatar_color: string }>();

  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    try {
      const [{ data: remoteSubs }, { data: viewRows }, { data: remoteProfiles }] =
        await Promise.all([
          sb.from("submissions").select("*"),
          sb.from("all_time_leaderboard").select("*"),
          sb.from("profiles").select("*"),
        ]);

      submissions = (remoteSubs as Submission[]) || [];

      if (viewRows) {
        for (const vr of viewRows) {
          profileMap.set(vr.user_id, {
            display_name: vr.display_name || "Player",
            avatar_color: vr.avatar_color || "#1D2D44",
          });
        }
      }
      if (remoteProfiles) {
        for (const rp of remoteProfiles) {
          if (rp.display_name) {
            profileMap.set(rp.id, {
              display_name: rp.display_name,
              avatar_color: rp.avatar_color || "#1D2D44",
            });
          }
        }
      }
    } catch {
      submissions = [];
    }
  } else {
    submissions = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) || "[]"
    ) as Submission[];
    const localProfiles = await getAllProfiles();
    for (const lp of localProfiles) {
      profileMap.set(lp.id, {
        display_name: lp.display_name,
        avatar_color: lp.avatar_color,
      });
    }
  }

  const games = await getGames(true);

  // Refinement 2: Compute Daily Crowns ONLY for completed days (play_date < todaySast)
  const completedDates = Array.from(
    new Set(submissions.map((s) => s.play_date).filter((d) => d < todaySast))
  );

  const crownsByUser = new Map<string, number>();
  for (const dateStr of completedDates) {
    const dayStandings = await getDailyLeaderboard(dateStr);
    for (const row of dayStandings) {
      if (row.daily_rank === 1) {
        crownsByUser.set(row.user_id, (crownsByUser.get(row.user_id) || 0) + 1);
      }
    }
  }

  const gameLeaderByGameId = new Map<string, { userId: string; avg: number; gameName: string }>();
  for (const game of games) {
    const subsForGame = submissions.filter((s) => s.game_id === game.id);
    const byUser = new Map<string, number[]>();
    for (const s of subsForGame) {
      const list = byUser.get(s.user_id) || [];
      list.push(Number(s.normalized_score));
      byUser.set(s.user_id, list);
    }
    let bestUser = "";
    let bestAvg = -1;
    for (const [uid, scores] of byUser.entries()) {
      if (scores.length >= 2) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestUser = uid;
        }
      }
    }
    if (bestUser) {
      gameLeaderByGameId.set(game.id, {
        userId: bestUser,
        avg: Number(bestAvg.toFixed(1)),
        gameName: game.name,
      });
    }
  }

  const userSubsMap = new Map<string, Submission[]>();
  for (const sub of submissions) {
    const arr = userSubsMap.get(sub.user_id) || [];
    arr.push(sub);
    userSubsMap.set(sub.user_id, arr);
  }

  const unranked: Omit<AllTimeLeaderboardRow, "all_time_rank">[] = [];

  for (const [userId, userSubs] of userSubsMap.entries()) {
    const pInfo = profileMap.get(userId) || {
      display_name: "Player",
      avatar_color: "#1D2D44",
    };

    const totalGamesLogged = userSubs.length;
    const distinctDates = Array.from(new Set(userSubs.map((s) => s.play_date))).sort();
    const daysActive = distinctDates.length;

    const cumulativeScore = Number(
      userSubs.reduce((acc, s) => acc + Number(s.normalized_score), 0).toFixed(2)
    );
    const careerAvg =
      totalGamesLogged > 0 ? Number((cumulativeScore / totalGamesLogged).toFixed(2)) : 0;

    const nonFailedCount = userSubs.filter((s) => !s.is_failed).length;
    const winRatePct =
      totalGamesLogged > 0 ? Math.round((nonFailedCount / totalGamesLogged) * 100) : 0;

    const dateSet = new Set(distinctDates);
    let streak = 0;
    let cursorOffset = dateSet.has(todaySast) ? 0 : dateSet.has(yesterdaySast) ? -1 : null;
    if (cursorOffset !== null) {
      while (true) {
        const d = getOffsetDateString(cursorOffset, new Date(), group.timezone);
        if (dateSet.has(d)) {
          streak += 1;
          cursorOffset -= 1;
        } else {
          break;
        }
      }
    }

    const badges: SpecialtyBadge[] = [];
    for (const [, leader] of gameLeaderByGameId.entries()) {
      if (leader.userId === userId) {
        badges.push({
          slug: `${leader.gameName.toLowerCase()}-specialist`,
          label: `${leader.gameName} Ace`,
          description: `Highest career average in ${leader.gameName} (${leader.avg} pts)`,
        });
      }
    }
    if (winRatePct === 100 && totalGamesLogged >= 3) {
      badges.push({
        slug: "unbroken",
        label: "100% Solve Rate",
        description: "Zero failed games logged",
      });
    }
    if (streak >= 3) {
      badges.push({
        slug: "streak-fire",
        label: `${streak}-Day Streak`,
        description: `Logged scores ${streak} days in a row`,
      });
    }

    unranked.push({
      group_id: group.id,
      user_id: userId,
      display_name: pInfo.display_name,
      avatar_color: pInfo.avatar_color,
      total_games_logged: totalGamesLogged,
      days_active: daysActive,
      cumulative_normalized_score: cumulativeScore,
      career_average_score: careerAvg,
      win_rate_pct: winRatePct,
      daily_crowns_won: crownsByUser.get(userId) || 0,
      active_streak: streak,
      specialty_badges: badges,
    });
  }

  unranked.sort((a, b) => b.cumulative_normalized_score - a.cumulative_normalized_score);

  let currentRank = 0;
  let lastScore: number | null = null;

  return unranked.map((row) => {
    if (row.cumulative_normalized_score !== lastScore) {
      currentRank += 1;
      lastScore = row.cumulative_normalized_score;
    }
    return {
      ...row,
      all_time_rank: currentRank,
    };
  });
}

export async function getAuditLogs(): Promise<SubmissionAuditLog[]> {
  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured()) {
    try {
      const [{ data: logs }, { data: games }, profiles] = await Promise.all([
        sb
          .from("submission_audit_logs")
          .select("*, submissions(game_id)")
          .order("changed_at", { ascending: false })
          .limit(25),
        sb.from("games").select("id, name"),
        getAllProfiles(),
      ]);

      if (logs) {
        const gameMap = new Map<string, string>();
        games?.forEach((g: { id: string; name: string }) => gameMap.set(g.id, g.name));
        const profMap = new Map<string, string>();
        profiles.forEach((p) => profMap.set(p.id, p.display_name));

        return logs.map((l: Record<string, unknown>) => {
          const subObj = l.submissions as { game_id?: string } | null;
          return {
            id: String(l.id),
            submission_id: String(l.submission_id),
            user_id: String(l.user_id),
            display_name: profMap.get(String(l.user_id)) || "Player",
            game_name: (subObj?.game_id && gameMap.get(subObj.game_id)) || "Game",
            previous_raw_score: l.previous_raw_score as number | null,
            previous_is_failed: Boolean(l.previous_is_failed),
            previous_normalized_score: Number(l.previous_normalized_score),
            new_raw_score: l.new_raw_score as number | null,
            new_is_failed: Boolean(l.new_is_failed),
            new_normalized_score: Number(l.new_normalized_score),
            changed_at: String(l.changed_at),
          };
        });
      }
    } catch {
      return [];
    }
  }

  ensureLocalStoreInitialized();
  if (typeof window === "undefined") return [];
  return JSON.parse(
    localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || "[]"
  ) as SubmissionAuditLog[];
}

export async function simulateFriendLiveSubmission(): Promise<{
  friendName: string;
  gameName: string;
  normalizedScore: number;
}> {
  ensureLocalStoreInitialized();
  const today = getLocalDateString();
  const games = await getGames(false);
  const profiles = await getAllProfiles();
  const currentUser = await getCurrentUser();
  const friends =
    profiles.filter((p) => p.id !== currentUser.id).length > 0
      ? profiles.filter((p) => p.id !== currentUser.id)
      : SEED_PROFILES.slice(1);
  const targetFriend = friends[0];
  const game = games[0];
  const res = await submitScore({
    gameId: game.id,
    rawScore: 3,
    isFailed: false,
    playDate: today,
    userId: targetFriend.id,
  });
  return {
    friendName: targetFriend.display_name,
    gameName: game.name,
    normalizedScore: res.submission?.normalized_score || 80,
  };
}

export async function resetDemoData(): Promise<void> {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  ensureLocalStoreInitialized();
  broadcastLocalChange("demo_reset");
}

export async function seedSampleFriends(): Promise<void> {
  if (typeof window === "undefined") return;
  ensureLocalStoreInitialized();
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SEED_PROFILES));
  localStorage.setItem(
    STORAGE_KEYS.SUBMISSIONS,
    JSON.stringify(buildInitialSeedSubmissions())
  );
  broadcastLocalChange("demo_seeded");
}

const realtimeSubscribers = new Set<() => void>();
let sharedRealtimeChannelInitialized = false;

export function subscribeToLeaderboardUpdates(onUpdate: () => void): () => void {
  const cleanups: Array<() => void> = [];

  realtimeSubscribers.add(onUpdate);
  cleanups.push(() => {
    realtimeSubscribers.delete(onUpdate);
  });

  const sb = getSupabaseBrowserClient();
  if (sb && isSupabaseConfigured() && !sharedRealtimeChannelInitialized) {
    sharedRealtimeChannelInitialized = true;
    try {
      sb.channel("wgl_shared_submissions_realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "submissions" },
          () => {
            realtimeSubscribers.forEach((listener) => {
              try {
                listener();
              } catch {
                // Ignore individual listener errors
              }
            });
          }
        )
        .subscribe();
    } catch {
      // Ignore if Realtime is unavailable
    }
  }

  if (typeof window !== "undefined") {
    const handleWindowUpdate = () => onUpdate();
    window.addEventListener("wgl-realtime-update", handleWindowUpdate);
    cleanups.push(() =>
      window.removeEventListener("wgl-realtime-update", handleWindowUpdate)
    );

    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = () => onUpdate();
        cleanups.push(() => bc.close());
      } catch {
        // Ignore
      }
    }
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}
