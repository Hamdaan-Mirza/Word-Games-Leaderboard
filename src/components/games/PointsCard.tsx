"use client";

import React, { useEffect, useState } from "react";
import { Check, Edit3, AlertCircle, Save } from "lucide-react";
import { GameConfig, Submission } from "@/types/leaderboard";
import { calculateNormalizedScore, formatScore } from "@/lib/normalization";

interface PointsCardProps {
  game: GameConfig;
  existingSubmission?: Submission;
  onSubmit: (
    gameId: string,
    rawScore: number | null,
    isFailed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

export function PointsCard({
  game,
  existingSubmission,
  onSubmit,
  disabled = false,
}: PointsCardProps) {
  const [inputValue, setInputValue] = useState<string>(
    existingSubmission?.raw_score !== null && existingSubmission?.raw_score !== undefined
      ? String(existingSubmission.raw_score)
      : ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      existingSubmission?.raw_score !== null &&
      existingSubmission?.raw_score !== undefined
    ) {
      setInputValue(String(existingSubmission.raw_score));
    }
  }, [existingSubmission?.raw_score]);

  const isCompleted = Boolean(existingSubmission) && !isEditing;

  const parsedNum =
    inputValue.trim() === "" ? null : parseInt(inputValue.trim(), 10);
  const liveCalc =
    parsedNum !== null && !Number.isNaN(parsedNum)
      ? calculateNormalizedScore(game, parsedNum, false)
      : null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || submitting) return;
    setError(null);

    if (parsedNum === null || Number.isNaN(parsedNum)) {
      setError(`Please enter a number between ${game.min_score} and ${game.max_score}.`);
      return;
    }

    const validation = calculateNormalizedScore(game, parsedNum, false);
    if (!validation.valid) {
      setError(validation.error || "Invalid score.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSubmit(game.id, parsedNum, false);
      if (!res.success) {
        setError(res.error || "Failed to save score.");
      } else {
        setIsEditing(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label={`${game.name} Daily Score Card`}
      className={`flex flex-col justify-between rounded-xl border-2 p-5 transition-all ${
        isCompleted
          ? "border-wcag-success bg-wcag-surface shadow-sm"
          : "border-wcag-border bg-wcag-surface shadow-sm"
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <span className="inline-block rounded border border-wcag-border bg-wcag-elevated px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-wcag-text">
              Points ({game.min_score}–{game.max_score} pts)
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold text-wcag-text">
              {game.name}
            </h3>
          </div>

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
            `Enter raw points (${game.min_score} to ${game.max_score}). Normalized to 0.00–100.00 scale.`}
        </p>
      </div>

      {/* Completed vs Input Form */}
      {isCompleted && existingSubmission ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-wcag-success bg-wcag-elevated p-3.5">
          <div>
            <span className="block text-xs font-bold uppercase text-wcag-muted">
              Logged Result Today
            </span>
            <span className="font-mono text-lg font-extrabold text-wcag-text tabular-nums">
              {existingSubmission.raw_score} / {game.max_score} raw
              {game.slug === "krillion" && existingSubmission.raw_score !== null
                ? ` (${(existingSubmission.raw_score * 10).toLocaleString()}m)`
                : ""}{" "}
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
        <form onSubmit={handleSave} className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
            <label
              htmlFor={`input-${game.slug}`}
              className="text-wcag-text"
            >
              Raw Score ({game.min_score}–{game.max_score}):
            </label>
            {liveCalc?.valid ? (
              <span
                aria-live="polite"
                className="font-mono text-sm font-extrabold text-wcag-text tabular-nums"
              >
                = {formatScore(liveCalc.normalizedScore)} normalized pts
                {game.slug === "krillion" && parsedNum !== null
                  ? ` (${(parsedNum * 10).toLocaleString()}m)`
                  : ""}
              </span>
            ) : (
              <span className="text-wcag-muted">
                e.g. 325 = 46.43 pts
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <input
              id={`input-${game.slug}`}
              type="number"
              inputMode="numeric"
              min={game.min_score}
              max={game.max_score}
              step={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              placeholder={`Enter ${game.min_score}–${game.max_score} (e.g. 325)`}
              disabled={disabled || submitting}
              className="min-h-[48px] flex-1 rounded-lg border-2 border-wcag-border bg-wcag-elevated px-4 py-2 font-mono text-lg font-bold text-wcag-text tabular-nums placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-wcag-muted/70 focus:border-palette-shadow"
            />

            <button
              type="submit"
              disabled={disabled || submitting}
              className="inline-flex min-h-[48px] min-w-[110px] items-center justify-center gap-2 rounded-lg bg-wcag-accent px-5 py-2.5 text-base font-bold text-wcag-accentText shadow-sm hover:bg-wcag-accentHover disabled:opacity-50"
            >
              <Save className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Save</span>
            </button>
          </div>

          {isEditing && (
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-[48px] rounded-lg px-3 py-1.5 text-sm font-bold text-wcag-muted hover:bg-wcag-elevated"
              >
                Cancel Edit
              </button>
            </div>
          )}
        </form>
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
