import { beforeEach, describe, expect, it } from "vitest";
import {
  addOrUpdateGame,
  getActiveGroup,
  getAllProfiles,
  getAllTimeLeaderboard,
  getAuditLogs,
  getCurrentUser,
  getDailyLeaderboard,
  getGames,
  getUserSubmissionsForDate,
  resetDemoData,
  SEED_GAMES,
  simulateFriendLiveSubmission,
  submitScore,
  subscribeToLeaderboardUpdates,
  switchDemoPersona,
  updateCurrentUserProfile,
} from "../src/lib/supabase/repository";
import { getLocalDateString, getOffsetDateString } from "../src/lib/timezone";

// Mock browser window & localStorage for full end-to-end repository verification
class LocalStorageMock {
  private store: Record<string, string> = {};
  clear() {
    this.store = {};
  }
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
}

describe("End-to-End Repository & Leaderboard Flows", () => {
  beforeEach(async () => {
    const ls = new LocalStorageMock();
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: ls,
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      writable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: ls,
      writable: true,
    });
    await resetDemoData();
  });

  it("initializes group, profiles, games, and current user properly", async () => {
    const group = await getActiveGroup();
    expect(group.invite_code).toBe("WORDS2026");

    const user = await getCurrentUser();
    expect(user.display_name).toBe("You (Alex)");

    const profiles = await getAllProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(5);

    const games = await getGames();
    expect(games.map((g) => g.slug)).toEqual(["wordle", "word500", "krillion"]);
  });

  it("submits scores, recalculates Daily Standings, and logs same-day edits to Audit Trail", async () => {
    const today = getLocalDateString();
    const user = await getCurrentUser();

    // Log Krillion: 325 raw -> 46.43 pts
    const res1 = await submitScore({
      gameId: SEED_GAMES[2].id,
      rawScore: 325,
      isFailed: false,
      playDate: today,
    });
    expect(res1.success).toBe(true);
    expect(res1.submission?.normalized_score).toBe(46.43);

    // Edit Krillion to 500 raw -> 71.43 pts (triggers AFTER UPDATE audit trail)
    const res2 = await submitScore({
      gameId: SEED_GAMES[2].id,
      rawScore: 500,
      isFailed: false,
      playDate: today,
    });
    expect(res2.success).toBe(true);
    expect(res2.isEdit).toBe(true);
    expect(res2.submission?.normalized_score).toBe(71.43);

    const audits = await getAuditLogs();
    expect(audits.length).toBe(1);
    expect(audits[0].previous_raw_score).toBe(325);
    expect(audits[0].new_raw_score).toBe(500);

    // Log Wordle: 3 tries -> 80.00 pts
    const res3 = await submitScore({
      gameId: SEED_GAMES[0].id,
      rawScore: 3,
      isFailed: false,
      playDate: today,
    });
    expect(res3.success).toBe(true);

    const mySubs = await getUserSubmissionsForDate(user.id, today);
    expect(mySubs.length).toBe(2);

    const daily = await getDailyLeaderboard(today);
    const myRow = daily.find((r) => r.user_id === user.id);
    expect(myRow).toBeDefined();
    expect(myRow?.total_daily_score).toBe(151.43);
  });

  it("blocks editing past dates after midnight cutoff", async () => {
    const yesterday = getOffsetDateString(-1);
    const res = await submitScore({
      gameId: SEED_GAMES[0].id,
      rawScore: 1,
      isFailed: false,
      playDate: yesterday,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("edit window");
  });

  it("computes All-Time Leaderboard with completed-day Crowns only", async () => {
    const allTime = await getAllTimeLeaderboard();
    expect(allTime.length).toBeGreaterThanOrEqual(4);
    expect(allTime[0].all_time_rank).toBe(1);
    // Total crowns across completed 3 days should be >= 3
    const totalCrowns = allTime.reduce((acc, r) => acc + r.daily_crowns_won, 0);
    expect(totalCrowns).toBeGreaterThanOrEqual(3);
  });

  it("supports admin dynamic game creation, persona switching, and live friend simulation", async () => {
    const addRes = await addOrUpdateGame({
      slug: "connections",
      name: "Connections",
      scoring_type: "ATTEMPTS_LOWER_BETTER",
      min_score: 4,
      max_score: 7,
    });
    expect(addRes.success).toBe(true);

    const sim = await simulateFriendLiveSubmission();
    expect(sim.friendName).toBeTruthy();

    const updatedProfile = await updateCurrentUserProfile({
      display_name: "Hamdaan",
      avatar_color: "#047857",
      invite_code: "WORDS2026",
    });
    expect(updatedProfile.display_name).toBe("Hamdaan");

    const switched = await switchDemoPersona("u0000000-0000-0000-0000-000000000002");
    expect(switched.display_name).toBe("Thabo M.");

    const unsub = subscribeToLeaderboardUpdates(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });
});

