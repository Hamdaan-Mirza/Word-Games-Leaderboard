"use client";

import React, { useState } from "react";
import { PlusCircle, CheckCircle2, AlertCircle, Power } from "lucide-react";
import { GameConfig, ScoringType } from "@/types/leaderboard";

interface GameConfigFormProps {
  games: GameConfig[];
  onSaveGame: (input: {
    slug: string;
    name: string;
    scoring_type: ScoringType;
    min_score: number;
    max_score: number;
    description?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onToggleGame: (gameId: string, isActive: boolean) => Promise<void>;
}

export function GameConfigForm({
  games,
  onSaveGame,
  onToggleGame,
}: GameConfigFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [scoringType, setScoringType] = useState<ScoringType>(
    "ATTEMPTS_LOWER_BETTER"
  );
  const [minScore, setMinScore] = useState("1");
  const [maxScore, setMaxScore] = useState("7");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const applyPreset = (preset: "connections" | "contexto") => {
    if (preset === "connections") {
      setName("Connections");
      setSlug("connections");
      setScoringType("ATTEMPTS_LOWER_BETTER");
      setMinScore("4");
      setMaxScore("7");
      setDescription("Group 16 words into 4 categories (4–7 attempts, or X/fail).");
    } else {
      setName("Contexto");
      setSlug("contexto");
      setScoringType("POINTS_HIGHER_BETTER");
      setMinScore("0");
      setMaxScore("100");
      setDescription("Semantic similarity word game (0–100 efficiency score).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = await onSaveGame({
      slug,
      name,
      scoring_type: scoringType,
      min_score: parseInt(minScore, 10),
      max_score: parseInt(maxScore, 10),
      description,
    });

    if (!res.success) {
      setFeedback({
        type: "error",
        text: res.error || "Could not add game.",
      });
    } else {
      setFeedback({
        type: "success",
        text: `Game "${name}" saved and normalized to the 0–100 equal-weight engine!`,
      });
      setName("");
      setSlug("");
      setDescription("");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Add New Daily Game Form */}
      <section
        aria-label="Add New Daily Game"
        className="rounded-xl border-2 border-wcag-border bg-wcag-surface p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-wcag-text">
              Admin Game Registry (UC-06)
            </h2>
            <p className="mt-1 text-sm text-wcag-muted">
              Add a new daily game dynamically without changing code.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset("connections")}
              className="min-h-[40px] rounded-lg border border-wcag-border bg-wcag-elevated px-3 py-1 text-xs font-bold text-wcag-text hover:border-palette-shadow"
            >
              + Preset: Connections
            </button>
            <button
              type="button"
              onClick={() => applyPreset("contexto")}
              className="min-h-[40px] rounded-lg border border-wcag-border bg-wcag-elevated px-3 py-1 text-xs font-bold text-wcag-text hover:border-palette-shadow"
            >
              + Preset: Contexto
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="game-name"
                className="block text-sm font-bold text-wcag-text"
              >
                Game Name
              </label>
              <input
                id="game-name"
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Connections"
                className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 text-base font-bold text-wcag-text placeholder:text-wcag-muted/70"
              />
            </div>

            <div>
              <label
                htmlFor="game-slug"
                className="block text-sm font-bold text-wcag-text"
              >
                Unique Slug
              </label>
              <input
                id="game-slug"
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. connections"
                className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 font-mono text-base font-bold text-wcag-text placeholder:text-wcag-muted/70"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="scoring-type"
              className="block text-sm font-bold text-wcag-text"
            >
              Scoring Direction
            </label>
            <select
              id="scoring-type"
              value={scoringType}
              onChange={(e) => setScoringType(e.target.value as ScoringType)}
              className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 text-base font-bold text-wcag-text"
            >
              <option value="ATTEMPTS_LOWER_BETTER" className="bg-wcag-surface text-wcag-text">
                ATTEMPTS_LOWER_BETTER (Lower tries = higher score, + X/Fail = 10 pts)
              </option>
              <option value="POINTS_HIGHER_BETTER" className="bg-wcag-surface text-wcag-text">
                POINTS_HIGHER_BETTER (Higher raw points = higher score, 0–100 scale)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="min-score"
                className="block text-sm font-bold text-wcag-text"
              >
                Min Raw Value
              </label>
              <input
                id="min-score"
                type="number"
                inputMode="numeric"
                required
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 font-mono text-base font-bold text-wcag-text tabular-nums"
              />
            </div>

            <div>
              <label
                htmlFor="max-score"
                className="block text-sm font-bold text-wcag-text"
              >
                Max Raw Value
              </label>
              <input
                id="max-score"
                type="number"
                inputMode="numeric"
                required
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 font-mono text-base font-bold text-wcag-text tabular-nums"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="game-desc"
              className="block text-sm font-bold text-wcag-text"
            >
              Card Instructions (Optional)
            </label>
            <input
              id="game-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown on the Bento card..."
              className="mt-1 min-h-[48px] w-full rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 text-base text-wcag-text placeholder:text-wcag-muted/70"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-wcag-accent px-5 py-3 text-base font-bold text-wcag-accentText hover:bg-wcag-accentHover"
          >
            <PlusCircle className="h-5 w-5" aria-hidden="true" />
            <span>Register Game in Equal-Weight Engine</span>
          </button>
        </form>

        {feedback && (
          <div
            role="status"
            className={`mt-4 flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-bold text-white ${
              feedback.type === "success"
                ? "border-wcag-success bg-wcag-success"
                : "border-wcag-danger bg-wcag-danger"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}
      </section>

      {/* Active Games Registry List */}
      <section
        aria-label="Registered Games"
        className="rounded-xl border-2 border-wcag-border bg-wcag-surface p-5 shadow-sm"
      >
        <h2 className="text-xl font-extrabold text-wcag-text">
          Configured Games ({games.length})
        </h2>
        <p className="mt-1 text-sm text-wcag-muted">
          Toggle games active or inactive on the daily dashboard.
        </p>

        <div className="mt-4 space-y-3">
          {games.map((g) => (
            <div
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-wcag-border bg-wcag-elevated p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-extrabold text-wcag-text">
                    {g.name}
                  </span>
                  <code className="rounded border border-wcag-border bg-wcag-surface px-2 py-0.5 font-mono text-xs font-bold text-wcag-text">
                    {g.slug}
                  </code>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold text-white ${
                      g.is_active ? "bg-wcag-success" : "bg-wcag-warning"
                    }`}
                  >
                    {g.is_active ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs font-bold text-wcag-muted tabular-nums">
                  {g.scoring_type} • Range: {g.min_score} to {g.max_score} → Normalized 0.00–100.00
                </p>
              </div>

              <button
                type="button"
                onClick={() => onToggleGame(g.id, !g.is_active)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-bold ${
                  g.is_active
                    ? "border-wcag-border bg-wcag-surface text-wcag-text hover:border-palette-shadow"
                    : "border-palette-shadow bg-wcag-accent text-wcag-accentText"
                }`}
              >
                <Power className="h-4 w-4" aria-hidden="true" />
                <span>{g.is_active ? "Pause Game" : "Enable Game"}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
