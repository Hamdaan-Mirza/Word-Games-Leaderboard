"use client";

import React, { useState } from "react";
import { Check, Edit3, AlertCircle } from "lucide-react";
import { GameConfig, Submission } from "@/types/leaderboard";
import { calculateNormalizedScore, formatScore } from "@/lib/normalization";

interface AttemptCardProps {
  game: GameConfig;
  existingSubmission?: Submission;
  onSubmit: (
    gameId: string,
    rawScore: number | null,
    isFailed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export function AttemptCard({
  game,
  existingSubmission,
  onSubmit,
  disabled = false,
}: AttemptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<{
    tries: number | null;
    failed: boolean;
  } | null>(null);

  const isCompleted = Boolean(existingSubmission) && !isEditing;

  const attemptsList: number[] = [];
  for (let i = game.min_score; i <= game.max_score; i++) {
    attemptsList.push(i);
  }

  const handleQuickTap = async (rawScore: number | null, isFailed: boolean) => {
    if (disabled || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await onSubmit(game.id, rawScore, isFailed);
      if (!res.success) {
        setError(res.error || "Failed to save score.");
      } else {
        setIsEditing(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewCalc = hoveredOption
    ? calculateNormalizedScore(game, hoveredOption.tries, hoveredOption.failed)
    : existingSubmission
    ? {
        valid: true,
        normalizedScore: existingSubmission.normalized_score,
      }
    : null;

  return (
    <section
      aria-label={`${game.name} Daily Score Card`}
      className={`flex flex-col justify-between rounded-xl border-2 p-5 transition-all ${
        isCompleted
          ? "border-wcag-success bg-wcag-surface shadow-sm"
          : "border-wcag-border bg-wcag-surface shadow-sm"
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="inline-block rounded bg-wcag-elevated px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-wcag-text border border-wcag-border">
              Attempts ({game.min_score}–{game.max_score} or X)
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold text-wcag-text">
              {game.name}
            </h3>
          </div>

          {/* Status Badge (NFR-2: Color paired with explicit icon ✓ Done) */}
          {existingSubmission ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-wcag-success px-3 py-1.5 font-mono text-sm font-bold text-white tabular-nums">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Done ({formatScore(Number(existingSubmission.normalized_score))} pts)
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-wcag-warning px-3 py-1.5 text-xs font-bold text-white">
              <span>Pending Entry</span>
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm text-wcag-muted">
          {game.description ||
            `Tap your attempt count (${game.min_score} to ${game.max_score}) or X for 10.00 participation pts.`}
        </p>
      </div>

      {/* Completed State vs Quick-Tap Pill Grid */}
      {isCompleted && existingSubmission ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-wcag-success bg-wcag-elevated p-3.5">
          <div>
            <span className="block text-xs font-bold uppercase text-wcag-muted">
              Logged Result Today
            </span>
            <span className="font-mono text-lg font-extrabold text-wcag-text tabular-nums">
              {existingSubmission.is_failed
                ? `Failed (X/${game.max_score})`
                : `${existingSubmission.raw_score} / ${game.max_score} ${
                    existingSubmission.raw_score === 1 ? "Try" : "Tries"
                  }`}{" "}
              ={" "}
              <span className="underline decoration-wcag-success decoration-2 underline-offset-4">
                {formatScore(Number(existingSubmission.normalized_score))} pts
              </span>
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 border-wcag-border bg-wcag-surface px-4 py-2 text-sm font-bold text-wcag-text hover:border-palette-shadow"
            >
              <Edit3 className="h-4 w-4" aria-hidden="true" />
              <span>Edit Score</span>
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-wcag-muted">
            <span>1-Tap Quick Entry (No Keyboard Needed):</span>
            {previewCalc && previewCalc.valid && (
              <span className="font-mono font-extrabold text-wcag-text tabular-nums">
                Preview: {formatScore(previewCalc.normalizedScore)} pts
              </span>
            )}
          </div>

          {/* 48x48px Minimum Touch Target Pill Buttons (NFR-3) */}
          <div
            role="group"
            aria-label={`Select attempts for ${game.name}`}
            className="grid grid-cols-4 gap-2 sm:grid-cols-5"
          >
            {attemptsList.map((tries) => {
              const isSelected =
                existingSubmission &&
                !existingSubmission.is_failed &&
                existingSubmission.raw_score === tries;
              const norm = calculateNormalizedScore(game, tries, false);

              return (
                <button
                  key={tries}
                  type="button"
                  disabled={disabled || submitting}
                  onMouseEnter={() => setHoveredOption({ tries, failed: false })}
                  onMouseLeave={() => setHoveredOption(null)}
                  onFocus={() => setHoveredOption({ tries, failed: false })}
                  onBlur={() => setHoveredOption(null)}
                  onClick={() => handleQuickTap(tries, false)}
                  aria-label={`${tries} ${
                    tries === 1 ? "try" : "tries"
                  } (${formatScore(norm.normalizedScore)} normalized points)`}
                  aria-pressed={isSelected}
                  className={`flex min-h-[52px] min-w-[48px] flex-col items-center justify-center rounded-lg border-2 px-2 py-1.5 font-mono transition-colors ${
                    isSelected
                      ? "border-palette-eggshell bg-wcag-accent text-wcag-accentText"
                      : "border-wcag-border bg-wcag-elevated text-wcag-text hover:border-palette-shadow hover:bg-wcag-accent hover:text-wcag-accentText"
                  }`}
                >
                  <span className="text-lg font-extrabold leading-none">{tries}</span>
                  <span className="mt-0.5 text-[11px] font-bold opacity-85 tabular-nums">
                    {Math.round(norm.normalizedScore)}p
                  </span>
                </button>
              );
            })}

            {/* Failed (X) Button = 10.00 Participation Credit */}
            <button
              type="button"
              disabled={disabled || submitting}
              onMouseEnter={() => setHoveredOption({ tries: null, failed: true })}
              onMouseLeave={() => setHoveredOption(null)}
              onFocus={() => setHoveredOption({ tries: null, failed: true })}
              onBlur={() => setHoveredOption(null)}
              onClick={() => handleQuickTap(null, true)}
              aria-label="Failed X (10.00 participation points)"
              aria-pressed={Boolean(existingSubmission?.is_failed)}
              className={`flex min-h-[52px] min-w-[48px] flex-col items-center justify-center rounded-lg border-2 px-2 py-1.5 font-mono transition-colors ${
                existingSubmission?.is_failed
                  ? "border-palette-eggshell bg-wcag-warning text-white"
                  : "border-wcag-warning bg-wcag-elevated text-wcag-text hover:bg-wcag-warning hover:text-white"
              }`}
            >
              <span className="text-lg font-extrabold leading-none">X</span>
              <span className="mt-0.5 text-[11px] font-bold opacity-85 tabular-nums">
                10p
              </span>
            </button>
          </div>

          {isEditing && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-[48px] rounded-lg px-3 py-1.5 text-sm font-bold text-wcag-muted hover:bg-wcag-elevated"
              >
                Cancel Edit
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-lg border-2 border-wcag-danger bg-wcag-danger p-3 text-sm font-bold text-white"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}
