"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Clock, Radio, Calendar } from "lucide-react";
import { DailyLeaderboardRow, GameConfig } from "@/types/leaderboard";
import { formatScore } from "@/lib/normalization";

interface DailyStandingsProps {
  rows: DailyLeaderboardRow[];
  games: GameConfig[];
  currentUserId: string;
  selectedDate: string;
  availableDates: { date: string; label: string }[];
  onSelectDate: (date: string) => void;
  rankChangeDeltas: Record<string, number>; // positive = moved up (e.g. +2), negative = moved down (-1)
  liveAnnouncement: string;
  onSimulateFriend?: () => void;
}

export function DailyStandings({
  rows,
  games,
  currentUserId,
  selectedDate,
  availableDates,
  onSelectDate,
  rankChangeDeltas,
  liveAnnouncement,
  onSimulateFriend,
}: DailyStandingsProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      aria-label="Daily Standings Leaderboard"
      className="rounded-xl border-2 border-wcag-border bg-wcag-surface shadow-sm"
    >
      {/* Screen-Reader Live Region for Rank Shifts (Phase 4 WCAG AA requirement) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Header & SAST Date Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-wcag-border p-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-extrabold text-wcag-text">
              Daily Standings (SAST / GMT+2)
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-wcag-success px-2.5 py-0.5 text-xs font-extrabold text-white">
              <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              <span>Realtime CDC</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-wcag-muted">
            Ranked via PostgreSQL{" "}
            <code className="rounded border border-wcag-border bg-wcag-elevated px-1.5 py-0.5 font-mono text-xs font-bold text-wcag-text">
              DENSE_RANK()
            </code>{" "}
            by Composite Score, with Average Per Game Played for asynchronous fairness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-wcag-muted" aria-hidden="true" />
            <label htmlFor="sast-date-select" className="sr-only">
              Select SAST Date
            </label>
            <select
              id="sast-date-select"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="min-h-[48px] rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3 py-2 text-sm font-bold text-wcag-text"
            >
              {availableDates.map((d) => (
                <option key={d.date} value={d.date} className="bg-wcag-surface text-wcag-text">
                  {d.label} ({d.date})
                </option>
              ))}
            </select>
          </div>

          {onSimulateFriend && (
            <button
              type="button"
              onClick={onSimulateFriend}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 border-palette-shadow bg-wcag-accent px-3.5 py-2 text-sm font-bold text-wcag-accentText hover:bg-wcag-accentHover"
              title="Simulate a friend submitting a game over WebSocket / BroadcastChannel"
            >
              <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Simulate Friend Score</span>
            </button>
          )}
        </div>
      </div>

      {/* Accessible Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-wcag-border bg-wcag-elevated text-xs font-extrabold uppercase tracking-wider text-wcag-text">
              <th scope="col" className="px-4 py-3.5">
                Rank / Shift
              </th>
              <th scope="col" className="px-4 py-3.5">
                Player
              </th>
              <th scope="col" className="px-4 py-3.5">
                Status
              </th>
              {games.map((g) => (
                <th key={g.id} scope="col" className="px-3 py-3.5 text-right">
                  {g.name}
                </th>
              ))}
              <th scope="col" className="px-4 py-3.5 text-right">
                Avg / Game
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Composite Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wcag-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + games.length}
                  className="px-6 py-10 text-center text-base font-bold text-wcag-muted"
                >
                  No scores logged for {selectedDate} yet. Tap a game card above to take #1!
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isMe = row.user_id === currentUserId;
                const delta = rankChangeDeltas[row.user_id] || 0;
                const isAllDone =
                  row.games_played >= row.total_active_games &&
                  row.total_active_games > 0;

                return (
                  <motion.tr
                    key={row.user_id}
                    layout={!prefersReducedMotion}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                    className={`${
                      isMe
                        ? "bg-wcag-elevated/90"
                        : "bg-wcag-surface hover:bg-wcag-elevated/50"
                    }`}
                  >
                    {/* Rank + Explicit Colorblind-Safe Icon Delta (▲ +N / ▼ -N) */}
                    <td className="px-4 py-4 font-mono tabular-nums">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-base font-extrabold ${
                            row.daily_rank === 1
                              ? "border-palette-eggshell bg-wcag-accent text-wcag-accentText"
                              : "border-wcag-border bg-wcag-elevated text-wcag-text"
                          }`}
                        >
                          #{row.daily_rank}
                        </span>

                        {delta > 0 && (
                          <span
                            className="inline-flex items-center rounded bg-wcag-success px-2 py-0.5 text-xs font-extrabold text-white"
                            aria-label={`Rank improved by ${delta}`}
                          >
                            ▲ +{delta}
                          </span>
                        )}
                        {delta < 0 && (
                          <span
                            className="inline-flex items-center rounded bg-wcag-warning px-2 py-0.5 text-xs font-extrabold text-white"
                            aria-label={`Rank dropped by ${Math.abs(delta)}`}
                          >
                            ▼ {delta}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Player Display Name & High-Contrast Avatar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-sm font-extrabold text-white"
                          style={{ backgroundColor: row.avatar_color }}
                          aria-hidden="true"
                        >
                          {row.display_name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <span className="font-bold text-wcag-text">
                            {row.display_name}
                          </span>
                          {isMe && (
                            <span className="ml-2 rounded border border-palette-shadow bg-wcag-accent px-2 py-0.5 text-xs font-bold text-wcag-accentText">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Completion Badge: Emerald #047857 (✓ Done) vs Amber #B45309 (Partial) */}
                    <td className="px-4 py-4">
                      {isAllDone ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-wcag-success px-2.5 py-1 font-mono text-xs font-bold text-white tabular-nums">
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Done ({row.games_played}/{row.total_active_games})
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-wcag-warning px-2.5 py-1 font-mono text-xs font-bold text-white tabular-nums">
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            Partial ({row.games_played}/{row.total_active_games})
                          </span>
                        </span>
                      )}
                    </td>

                    {/* Individual Game Normalized Scores */}
                    {games.map((g) => {
                      const sub = row.submissions_by_game[g.id];
                      return (
                        <td
                          key={g.id}
                          className="px-3 py-4 text-right font-mono text-sm tabular-nums"
                        >
                          {sub ? (
                            <div>
                              <span className="font-extrabold text-wcag-text">
                                {formatScore(sub.normalized_score)}
                              </span>
                              <span className="block text-xs text-wcag-muted">
                                {sub.is_failed
                                  ? "Failed (X)"
                                  : g.scoring_type === "ATTEMPTS_LOWER_BETTER"
                                  ? `${sub.raw_score}/${g.max_score} tries`
                                  : `${sub.raw_score} raw`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-wcag-muted/60">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Secondary Metric: Average Per Game Played (Fairness for Partial Days) */}
                    <td className="px-4 py-4 text-right font-mono text-base font-bold text-wcag-muted tabular-nums">
                      {formatScore(row.avg_game_score)}
                    </td>

                    {/* Primary Metric: Daily Composite Score */}
                    <td className="px-4 py-4 text-right font-mono text-lg font-extrabold text-wcag-text tabular-nums">
                      {formatScore(row.total_daily_score)}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
