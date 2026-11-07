"use client";

import React from "react";
import { Crown, Flame, Award, Trophy } from "lucide-react";
import { AllTimeLeaderboardRow } from "@/types/leaderboard";
import { formatScore } from "@/lib/normalization";

interface AllTimeHallProps {
  rows: AllTimeLeaderboardRow[];
  currentUserId: string;
}

export function AllTimeHall({ rows, currentUserId }: AllTimeHallProps) {
  return (
    <section
      aria-label="All-Time Hall of Fame Leaderboard"
      className="rounded-xl border-2 border-wcag-border bg-wcag-surface shadow-sm"
    >
      <div className="border-b-2 border-wcag-border p-5">
        <div className="flex items-center gap-2.5">
          <Trophy className="h-6 w-6 text-palette-shadow" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-wcag-text">
            All-Time Hall of Fame
          </h2>
        </div>
        <p className="mt-1 text-sm text-wcag-muted">
          Cumulative normalized points across all days, Mean Score per Game Played (fairness if a day is missed), Completed-Day Crowns Won, Active Streaks, and Per-Game Specialty Badges.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-wcag-border bg-wcag-elevated text-xs font-extrabold uppercase tracking-wider text-wcag-text">
              <th scope="col" className="px-4 py-3.5">
                Rank
              </th>
              <th scope="col" className="px-4 py-3.5">
                Player &amp; Specialty Badges
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Daily Crowns
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Active Streak
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Win Rate %
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Games Logged
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Mean / Game
              </th>
              <th scope="col" className="px-4 py-3.5 text-right">
                Cumulative Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-wcag-border">
            {rows.map((row) => {
              const isMe = row.user_id === currentUserId;
              return (
                <tr
                  key={row.user_id}
                  className={
                    isMe
                      ? "bg-wcag-elevated/90"
                      : "bg-wcag-surface hover:bg-wcag-elevated/50"
                  }
                >
                  {/* Rank */}
                  <td className="px-4 py-4 font-mono tabular-nums">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-base font-extrabold ${
                        row.all_time_rank === 1
                          ? "border-palette-eggshell bg-wcag-accent text-wcag-accentText"
                          : "border-wcag-border bg-wcag-elevated text-wcag-text"
                      }`}
                    >
                      #{row.all_time_rank}
                    </span>
                  </td>

                  {/* Player & Specialty Badges */}
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-sm font-extrabold text-white"
                        style={{ backgroundColor: row.avatar_color }}
                        aria-hidden="true"
                      >
                        {row.display_name.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-wcag-text">
                            {row.display_name}
                          </span>
                          {isMe && (
                            <span className="rounded border border-palette-shadow bg-wcag-accent px-2 py-0.5 text-xs font-bold text-wcag-accentText">
                              You
                            </span>
                          )}
                        </div>

                        {row.specialty_badges.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {row.specialty_badges.map((badge) => (
                              <span
                                key={badge.slug}
                                title={badge.description}
                                className="inline-flex items-center gap-1 rounded-md border border-wcag-border bg-wcag-elevated px-2.5 py-0.5 text-xs font-bold text-wcag-text"
                              >
                                <Award className="h-3 w-3 shrink-0 text-palette-shadow" aria-hidden="true" />
                                <span>{badge.label}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Daily Crowns Won (Completed Days < Today SAST) */}
                  <td className="px-4 py-4 text-right font-mono tabular-nums">
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-wcag-warning px-2.5 py-1 text-sm font-extrabold text-white"
                      title="Daily Crowns awarded only for completed SAST days"
                    >
                      <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{row.daily_crowns_won}</span>
                    </span>
                  </td>

                  {/* Active Streak */}
                  <td className="px-4 py-4 text-right font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1 rounded-md bg-wcag-success px-2.5 py-1 text-sm font-extrabold text-white">
                      <Flame className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{row.active_streak}d</span>
                    </span>
                  </td>

                  {/* Win Rate % */}
                  <td className="px-4 py-4 text-right font-mono text-sm font-bold text-wcag-text tabular-nums">
                    {row.win_rate_pct}%
                  </td>

                  {/* Total Games Logged */}
                  <td className="px-4 py-4 text-right font-mono text-sm font-bold text-wcag-muted tabular-nums">
                    {row.total_games_logged} ({row.days_active}d)
                  </td>

                  {/* Career Average Score per Game Played */}
                  <td className="px-4 py-4 text-right font-mono text-base font-extrabold text-wcag-text tabular-nums">
                    {formatScore(row.career_average_score)}
                  </td>

                  {/* Cumulative Normalized Points */}
                  <td className="px-4 py-4 text-right font-mono text-lg font-extrabold text-wcag-text tabular-nums">
                    {formatScore(row.cumulative_normalized_score)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
