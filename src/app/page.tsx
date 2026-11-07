"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trophy, Calendar, Sparkles } from "lucide-react";
import {
  AllTimeLeaderboardRow,
  DailyLeaderboardRow,
  GameConfig,
  Submission,
  SubmissionAuditLog,
  UserProfile,
} from "@/types/leaderboard";
import {
  getAllTimeLeaderboard,
  getAuditLogs,
  getCurrentUser,
  getDailyLeaderboard,
  getGames,
  getUserSubmissionsForDate,
  simulateFriendLiveSubmission,
  submitScore,
  subscribeToLeaderboardUpdates,
} from "@/lib/supabase/repository";
import { getLocalDateString, getOffsetDateString } from "@/lib/timezone";
import { GameBentoGrid } from "@/components/games/GameBentoGrid";
import { DailyStandings } from "@/components/leaderboard/DailyStandings";
import { AllTimeHall } from "@/components/leaderboard/AllTimeHall";
import { AuditHistory } from "@/components/leaderboard/AuditHistory";

export default function DashboardPage() {
  const todaySast = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todaySast);
  const [activeTab, setActiveTab] = useState<"daily" | "alltime">("daily");

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [userSubs, setUserSubs] = useState<Submission[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyLeaderboardRow[]>([]);
  const [allTimeRows, setAllTimeRows] = useState<AllTimeLeaderboardRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<SubmissionAuditLog[]>([]);

  const [rankDeltas, setRankDeltas] = useState<Record<string, number>>({});
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const prevRanksRef = useRef<Record<string, number>>({});

  const availableDates = [
    { date: todaySast, label: "Today — SAST" },
    { date: getOffsetDateString(-1), label: "Yesterday" },
    { date: getOffsetDateString(-2), label: "2 Days Ago" },
    { date: getOffsetDateString(-3), label: "3 Days Ago" },
  ];

  const refreshData = useCallback(
    async (announcePrefix?: string) => {
      const [user, activeGames, dRows, atRows, logs] = await Promise.all([
        getCurrentUser(),
        getGames(false),
        getDailyLeaderboard(selectedDate),
        getAllTimeLeaderboard(),
        getAuditLogs(),
      ]);

      const uSubs = await getUserSubmissionsForDate(user.id, selectedDate);

      // Compute rank deltas compared to previous snapshot on the same date
      const newDeltas: Record<string, number> = {};
      const prevMap = prevRanksRef.current;
      let announcement = announcePrefix || "";

      for (const r of dRows) {
        const prevRank = prevMap[r.user_id];
        if (prevRank !== undefined && prevRank !== r.daily_rank) {
          const diff = prevRank - r.daily_rank; // positive = moved up (e.g. 3 -> 1 = +2)
          newDeltas[r.user_id] = diff;
          if (!announcement) {
            announcement = `${r.display_name} moved to rank #${r.daily_rank} with ${r.total_daily_score.toFixed(
              2
            )} points.`;
          }
        }
      }

      // Update snapshot
      const nextMap: Record<string, number> = {};
      for (const r of dRows) {
        nextMap[r.user_id] = r.daily_rank;
      }
      prevRanksRef.current = nextMap;

      if (Object.keys(newDeltas).length > 0) {
        setRankDeltas(newDeltas);
      }
      if (announcement) {
        setLiveAnnouncement(announcement);
      }

      setCurrentUser(user);
      setGames(activeGames);
      setUserSubs(uSubs);
      setDailyRows(dRows);
      setAllTimeRows(atRows);
      setAuditLogs(logs);
    },
    [selectedDate]
  );

  useEffect(() => {
    prevRanksRef.current = {};
    setRankDeltas({});
    refreshData();

    // Refinement 1: Subscribe to Realtime changes on `submissions` base table & re-fetch views
    const unsubscribe = subscribeToLeaderboardUpdates(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, [refreshData]);

  const handleScoreSubmit = async (
    gameId: string,
    rawScore: number | null,
    isFailed: boolean
  ) => {
    const res = await submitScore({
      gameId,
      rawScore,
      isFailed,
      playDate: selectedDate,
    });
    if (res.success && res.submission) {
      const g = games.find((x) => x.id === gameId);
      await refreshData(
        `Saved ${g?.name || "game"} score: ${res.submission.normalized_score.toFixed(
          2
        )} normalized points.`
      );
    }
    return { success: res.success, error: res.error };
  };

  const handleSimulateFriend = async () => {
    const sim = await simulateFriendLiveSubmission();
    await refreshData(
      `Live update: ${sim.friendName} logged ${sim.gameName} (+${sim.normalizedScore.toFixed(
        2
      )} pts)!`
    );
  };

  const isPastDate = selectedDate < todaySast;

  return (
    <div className="space-y-8">
      {/* Live Toast Banner when a Rank Shift or Score Update Occurs */}
      {liveAnnouncement && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-palette-shadow bg-wcag-surface px-4 py-3 text-sm font-bold text-wcag-text shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-palette-shadow" aria-hidden="true" />
            <span>{liveAnnouncement}</span>
          </div>
          <button
            type="button"
            onClick={() => setLiveAnnouncement("")}
            className="min-h-[36px] rounded border border-wcag-border bg-wcag-elevated px-2.5 py-1 text-xs font-extrabold text-wcag-text hover:border-palette-shadow"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick-Tap Game Bento Grid & Share-Text Auto-Parser */}
      <GameBentoGrid
        games={games}
        userSubmissions={userSubs}
        onSubmitScore={handleScoreSubmit}
        isPastDate={isPastDate}
      />

      {/* Leaderboard View Switcher (Daily Standings vs. All-Time Hall of Fame) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Leaderboard Mode Switcher"
            className="inline-flex rounded-xl border-2 border-wcag-border bg-wcag-surface p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "daily"}
              onClick={() => setActiveTab("daily")}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-5 py-2 text-base font-extrabold transition-colors ${
                activeTab === "daily"
                  ? "bg-wcag-accent text-wcag-accentText shadow-sm"
                  : "text-wcag-text hover:bg-wcag-elevated"
              }`}
            >
              <Calendar className="h-5 w-5" aria-hidden="true" />
              <span>Today&apos;s Standings</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "alltime"}
              onClick={() => setActiveTab("alltime")}
              className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg px-5 py-2 text-base font-extrabold transition-colors ${
                activeTab === "alltime"
                  ? "bg-wcag-accent text-wcag-accentText shadow-sm"
                  : "text-wcag-text hover:bg-wcag-elevated"
              }`}
            >
              <Trophy className="h-5 w-5" aria-hidden="true" />
              <span>All-Time Hall of Fame</span>
            </button>
          </div>
        </div>

        {activeTab === "daily" ? (
          <DailyStandings
            rows={dailyRows}
            games={games}
            currentUserId={currentUser?.id || ""}
            selectedDate={selectedDate}
            availableDates={availableDates}
            onSelectDate={setSelectedDate}
            rankChangeDeltas={rankDeltas}
            liveAnnouncement={liveAnnouncement}
            onSimulateFriend={
              selectedDate === todaySast ? handleSimulateFriend : undefined
            }
          />
        ) : (
          <AllTimeHall
            rows={allTimeRows}
            currentUserId={currentUser?.id || ""}
          />
        )}
      </div>

      {/* Same-Day Edit Audit Trail (UC-05) */}
      <AuditHistory logs={auditLogs} />
    </div>
  );
}
