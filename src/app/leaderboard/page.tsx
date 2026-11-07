"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AllTimeLeaderboardRow,
  DailyLeaderboardRow,
  GameConfig,
  UserProfile,
} from "@/types/leaderboard";
import {
  getAllTimeLeaderboard,
  getCurrentUser,
  getDailyLeaderboard,
  getGames,
  subscribeToLeaderboardUpdates,
} from "@/lib/supabase/repository";
import { getLocalDateString, getOffsetDateString } from "@/lib/timezone";
import { AllTimeHall } from "@/components/leaderboard/AllTimeHall";
import { DailyStandings } from "@/components/leaderboard/DailyStandings";

export default function LeaderboardPage() {
  const todaySast = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todaySast);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<GameConfig[]>([]);
  const [dailyRows, setDailyRows] = useState<DailyLeaderboardRow[]>([]);
  const [allTimeRows, setAllTimeRows] = useState<AllTimeLeaderboardRow[]>([]);

  const availableDates = [
    { date: todaySast, label: "Today — SAST" },
    { date: getOffsetDateString(-1), label: "Yesterday" },
    { date: getOffsetDateString(-2), label: "2 Days Ago" },
    { date: getOffsetDateString(-3), label: "3 Days Ago" },
  ];

  const loadStandings = useCallback(async () => {
    const [u, g, d, at] = await Promise.all([
      getCurrentUser(),
      getGames(false),
      getDailyLeaderboard(selectedDate),
      getAllTimeLeaderboard(),
    ]);
    setCurrentUser(u);
    setGames(g);
    setDailyRows(d);
    setAllTimeRows(at);
  }, [selectedDate]);

  useEffect(() => {
    loadStandings();
    const unsub = subscribeToLeaderboardUpdates(() => {
      loadStandings();
    });
    return () => unsub();
  }, [loadStandings]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-wcag-text sm:text-3xl">
          All-Time Hall of Fame &amp; Historical Standings
        </h1>
        <p className="mt-1 text-base text-wcag-muted">
          Compare career efficiency, completed-day Crowns won, active streaks, and daily rank shifts.
        </p>
      </div>

      <AllTimeHall
        rows={allTimeRows}
        currentUserId={currentUser?.id || ""}
      />

      <DailyStandings
        rows={dailyRows}
        games={games}
        currentUserId={currentUser?.id || ""}
        selectedDate={selectedDate}
        availableDates={availableDates}
        onSelectDate={setSelectedDate}
        rankChangeDeltas={{}}
        liveAnnouncement=""
      />
    </div>
  );
}

