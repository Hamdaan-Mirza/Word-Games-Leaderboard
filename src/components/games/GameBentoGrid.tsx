"use client";

import React from "react";
import { GameConfig, Submission } from "@/types/leaderboard";
import { AttemptCard } from "./AttemptCard";
import { PointsCard } from "./PointsCard";
import { ShareTextParser } from "./ShareTextParser";
import { formatScore } from "@/lib/normalization";

interface GameBentoGridProps {
  games: GameConfig[];
  userSubmissions: Submission[];
  onSubmitScore: (
    gameId: string,
    rawScore: number | null,
    isFailed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  isPastDate?: boolean;
}

export function GameBentoGrid({
  games,
  userSubmissions,
  onSubmitScore,
  isPastDate = false,
}: GameBentoGridProps) {
  const subByGameId = new Map<string, Submission>();
  for (const s of userSubmissions) {
    subByGameId.set(s.game_id, s);
  }

  const totalScore = userSubmissions.reduce(
    (acc, s) => acc + Number(s.normalized_score),
    0
  );
  const completedCount = userSubmissions.length;
  const avgPerGame = completedCount > 0 ? totalScore / completedCount : 0;

  return (
    <div className="space-y-5">
      {/* Player's Today Progress Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 border-wcag-border bg-wcag-surface p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-wcag-text">
            Today&apos;s Equal-Weight Game Log
          </h2>
          <p className="text-sm text-wcag-muted">
            Every game is normalized to a 0.00–100.00 scale so all games carry equal weight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-lg border border-wcag-border bg-wcag-elevated px-3.5 py-2 text-right">
            <span className="block text-xs font-bold uppercase text-wcag-muted">
              Games Completed
            </span>
            <span className="font-mono text-lg font-extrabold text-wcag-text tabular-nums">
              {completedCount} / {games.length}
            </span>
          </div>

          <div className="rounded-lg border border-wcag-border bg-wcag-elevated px-3.5 py-2 text-right">
            <span className="block text-xs font-bold uppercase text-wcag-muted">
              Avg / Game Played
            </span>
            <span className="font-mono text-lg font-extrabold text-wcag-text tabular-nums">
              {formatScore(avgPerGame)} pts
            </span>
          </div>

          <div className="rounded-lg border border-palette-shadow bg-wcag-accent px-4 py-2 text-right text-wcag-accentText">
            <span className="block text-xs font-bold uppercase opacity-90">
              Your Composite Total
            </span>
            <span className="font-mono text-xl font-extrabold tabular-nums">
              {formatScore(totalScore)} / {games.length * 100} pts
            </span>
          </div>
        </div>
      </div>

      {/* Share-Text Auto-Parser (UC-03) */}
      {!isPastDate && (
        <ShareTextParser games={games} onSubmitParsed={onSubmitScore} />
      )}

      {/* Quick-Tap Bento Grid (UC-02) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => {
          const existing = subByGameId.get(game.id);
          if (game.scoring_type === "ATTEMPTS_LOWER_BETTER") {
            return (
              <AttemptCard
                key={game.id}
                game={game}
                existingSubmission={existing}
                onSubmit={onSubmitScore}
                disabled={isPastDate}
              />
            );
          }
          return (
            <PointsCard
              key={game.id}
              game={game}
              existingSubmission={existing}
              onSubmit={onSubmitScore}
              disabled={isPastDate}
            />
          );
        })}
      </div>
    </div>
  );
}
