"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RotateCcw, Calculator, Palette } from "lucide-react";
import { GameConfig, ScoringType, SubmissionAuditLog } from "@/types/leaderboard";
import {
  addOrUpdateGame,
  getAuditLogs,
  getGames,
  resetDemoData,
  subscribeToLeaderboardUpdates,
  toggleGameActive,
} from "@/lib/supabase/repository";
import { GameConfigForm } from "@/components/admin/GameConfigForm";
import { AuditHistory } from "@/components/leaderboard/AuditHistory";

const PALETTE_SWATCHES = [
  {
    hex: "#0D1321",
    name: "Deep Midnight Navy",
    role: "Dark Mode Page Background / Light Mode Primary Text",
    contrast: "15.8:1 AAA with #F0EBD8",
    textColor: "#F0EBD8",
  },
  {
    hex: "#1D2D44",
    name: "Prussian Blue",
    role: "Dark Mode Card Surface / Light Mode Primary Accent",
    contrast: "12.0:1 AAA with #F0EBD8",
    textColor: "#F0EBD8",
  },
  {
    hex: "#3E5C76",
    name: "Paynes Steel Blue",
    role: "Dark Mode Interactive Accent & Borders",
    contrast: "6.1:1 AA with #F0EBD8",
    textColor: "#F0EBD8",
  },
  {
    hex: "#748CAB",
    name: "Shadow Slate Blue",
    role: "Focus Rings, Active Borders & Muted Accents",
    contrast: "5.4:1 AA with #0D1321",
    textColor: "#0D1321",
  },
  {
    hex: "#F0EBD8",
    name: "Warm Eggshell Cream",
    role: "Dark Mode Primary Text / Light Mode Elevated Surface",
    contrast: "15.8:1 AAA with #0D1321",
    textColor: "#0D1321",
  },
];

export default function AdminPage() {
  const [games, setGames] = useState<GameConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<SubmissionAuditLog[]>([]);
  const [resetConfirmed, setResetConfirmed] = useState(false);

  const loadAdminData = useCallback(async () => {
    const [g, logs] = await Promise.all([getGames(true), getAuditLogs()]);
    setGames(g);
    setAuditLogs(logs);
  }, []);

  useEffect(() => {
    loadAdminData();
    const unsub = subscribeToLeaderboardUpdates(() => {
      loadAdminData();
    });
    return () => unsub();
  }, [loadAdminData]);

  const handleSaveGame = async (input: {
    slug: string;
    name: string;
    scoring_type: ScoringType;
    min_score: number;
    max_score: number;
    description?: string;
  }) => {
    const res = await addOrUpdateGame(input);
    if (res.success) {
      await loadAdminData();
    }
    return { success: res.success, error: res.error };
  };

  const handleToggleGame = async (gameId: string, isActive: boolean) => {
    await toggleGameActive(gameId, isActive);
    await loadAdminData();
  };

  const handleResetDemo = async () => {
    await resetDemoData();
    setResetConfirmed(true);
    setTimeout(() => setResetConfirmed(false), 3000);
    await loadAdminData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-wcag-text sm:text-3xl">
            Group Admin, Normalization Engine &amp; Audit Logs
          </h1>
          <p className="mt-1 text-base text-wcag-muted">
            Configure daily games dynamically, inspect normalization formulas, and review same-day score edits.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border-2 border-wcag-border bg-wcag-surface px-4 py-2 text-sm font-bold text-wcag-text hover:border-palette-shadow"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>{resetConfirmed ? "✓ Demo Data Reset!" : "Reset Demo Seed Data"}</span>
        </button>
      </div>

      {/* Dynamic Game Registry Form (UC-06) */}
      <GameConfigForm
        games={games}
        onSaveGame={handleSaveGame}
        onToggleGame={handleToggleGame}
      />

      {/* WCAG 2.1 AA/AAA 5-Swatch Palette Showcase */}
      <section
        aria-label="WCAG 2.1 Color Palette and Contrast Verification"
        className="rounded-xl border-2 border-wcag-border bg-wcag-surface p-5 shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <Palette className="h-5 w-5 text-palette-shadow" aria-hidden="true" />
          <h2 className="text-xl font-extrabold text-wcag-text">
            WCAG 2.1 AA/AAA Complementary Dark &amp; Light Palette
          </h2>
        </div>
        <p className="mt-1 text-sm text-wcag-muted">
          Built from the 5-swatch palette (<code className="font-mono font-bold">#0D1321</code>,{" "}
          <code className="font-mono font-bold">#1D2D44</code>,{" "}
          <code className="font-mono font-bold">#3E5C76</code>,{" "}
          <code className="font-mono font-bold">#748CAB</code>,{" "}
          <code className="font-mono font-bold">#F0EBD8</code>) paired with Okabe-Ito status badges and explicit directional icons (<code className="font-mono font-bold">▲ / ▼ / ✓</code>).
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PALETTE_SWATCHES.map((s) => (
            <div
              key={s.hex}
              style={{ backgroundColor: s.hex, color: s.textColor }}
              className="flex flex-col justify-between rounded-xl border-2 border-wcag-border p-4 shadow-sm"
            >
              <div>
                <span className="font-mono text-lg font-extrabold tracking-wider">
                  {s.hex}
                </span>
                <h3 className="mt-0.5 text-sm font-bold">{s.name}</h3>
                <p className="mt-2 text-xs opacity-90">{s.role}</p>
              </div>
              <div className="mt-4 border-t border-current/20 pt-2 font-mono text-xs font-extrabold">
                {s.contrast}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Equal-Weight Score Normalization Reference Table (PDF Section 2) */}
      <section
        aria-label="Score Normalization Reference Table"
        className="rounded-xl border-2 border-wcag-border bg-wcag-surface shadow-sm"
      >
        <div className="border-b-2 border-wcag-border p-5">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-palette-shadow" aria-hidden="true" />
            <h2 className="text-xl font-extrabold text-wcag-text">
              Score Normalization Reference Table (0.00 – 100.00 Scale)
            </h2>
          </div>
          <p className="mt-1 text-sm text-wcag-muted">
            Every raw score is converted on write via a deterministic PostgreSQL{" "}
            <code className="rounded border border-wcag-border bg-wcag-elevated px-1.5 py-0.5 font-mono text-xs font-bold text-wcag-text">
              BEFORE INSERT OR UPDATE
            </code>{" "}
            trigger so client code can never tamper with point weighting.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-wcag-border bg-wcag-elevated text-xs font-extrabold uppercase tracking-wider text-wcag-text">
                <th scope="col" className="px-4 py-3.5">
                  Game
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Metric / Scale
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Raw Score
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Formula / Mapping
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Normalized Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wcag-border font-mono text-sm tabular-nums">
              <tr className="bg-wcag-surface">
                <td className="px-4 py-3.5 font-sans font-bold text-wcag-text">
                  Wordle
                </td>
                <td className="px-4 py-3.5 font-sans text-wcag-muted">
                  Attempts (Lower Better)
                </td>
                <td className="px-4 py-3.5 font-bold text-wcag-text">1–6 Tries</td>
                <td className="px-4 py-3.5 text-wcag-text">
                  Direct Step Scale (100, 90, 80, 65, 50, 35)
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-wcag-text">
                  35.00 – 100.00
                </td>
              </tr>
              <tr className="bg-wcag-elevated/60">
                <td className="px-4 py-3.5 font-sans font-bold text-wcag-text">
                  Wordle (Failed)
                </td>
                <td className="px-4 py-3.5 font-sans text-wcag-muted">
                  Failed Attempt
                </td>
                <td className="px-4 py-3.5 font-bold text-wcag-text">X</td>
                <td className="px-4 py-3.5 text-wcag-text">
                  Flat Participation Credit (rewards playing vs skipping)
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-wcag-text">
                  10.00
                </td>
              </tr>
              <tr className="bg-wcag-surface">
                <td className="px-4 py-3.5 font-sans font-bold text-wcag-text">
                  Word500
                </td>
                <td className="px-4 py-3.5 font-sans text-wcag-muted">
                  Attempts (Lower Better)
                </td>
                <td className="px-4 py-3.5 font-bold text-wcag-text">1–8 Tries</td>
                <td className="px-4 py-3.5 text-wcag-text">
                  100 - ((attempts - 1) * 11)
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-wcag-text">
                  23.00 – 100.00
                </td>
              </tr>
              <tr className="bg-wcag-elevated/60">
                <td className="px-4 py-3.5 font-sans font-bold text-wcag-text">
                  Word500 (Failed)
                </td>
                <td className="px-4 py-3.5 font-sans text-wcag-muted">
                  Failed Attempt
                </td>
                <td className="px-4 py-3.5 font-bold text-wcag-text">X</td>
                <td className="px-4 py-3.5 text-wcag-text">
                  Flat Participation Credit
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-wcag-text">
                  10.00
                </td>
              </tr>
              <tr className="bg-wcag-surface">
                <td className="px-4 py-3.5 font-sans font-bold text-wcag-text">
                  Krillion
                </td>
                <td className="px-4 py-3.5 font-sans text-wcag-muted">
                  Points (Higher Better)
                </td>
                <td className="px-4 py-3.5 font-bold text-wcag-text">0–700 Pts</td>
                <td className="px-4 py-3.5 text-wcag-text">
                  ROUND((raw_score / 700.0) * 100, 2)
                </td>
                <td className="px-4 py-3.5 text-right font-extrabold text-wcag-text">
                  0.00 – 100.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Audit Trail Log */}
      <AuditHistory logs={auditLogs} />
    </div>
  );
}
