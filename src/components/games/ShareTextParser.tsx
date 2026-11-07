"use client";

import React, { useState } from "react";
import { ClipboardPaste, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { GameConfig } from "@/types/leaderboard";
import { parseGameShareText } from "@/lib/share-parser";
import { calculateNormalizedScore, formatScore } from "@/lib/normalization";

interface ShareTextParserProps {
  games: GameConfig[];
  onSubmitParsed: (
    gameId: string,
    rawScore: number | null,
    isFailed: boolean
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ShareTextParser({ games, onSubmitParsed }: ShareTextParserProps) {
  const [rawPaste, setRawPaste] = useState("");
  const [statusMsg, setStatusMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleParseAndLog = async (textToParse: string) => {
    setStatusMsg(null);
    const parsed = parseGameShareText(textToParse);
    // Refinement 5: Immediately clear raw input state so emoji grids / spoilers are never kept in memory
    setRawPaste("");

    if (!parsed.matched || !parsed.gameSlug) {
      setStatusMsg({
        type: "error",
        text: parsed.error || "Could not parse share text.",
      });
      return;
    }

    const targetGame = games.find(
      (g) => g.slug.toLowerCase() === parsed.gameSlug?.toLowerCase()
    );
    if (!targetGame) {
      setStatusMsg({
        type: "error",
        text: `Detected ${parsed.gameSlug}, but this game is not active in your group registry.`,
      });
      return;
    }

    const norm = calculateNormalizedScore(
      targetGame,
      parsed.rawScore,
      parsed.isFailed
    );
    if (!norm.valid) {
      setStatusMsg({
        type: "error",
        text: norm.error || "Extracted score is out of range.",
      });
      return;
    }

    const res = await onSubmitParsed(
      targetGame.id,
      parsed.rawScore,
      parsed.isFailed
    );
    if (!res.success) {
      setStatusMsg({
        type: "error",
        text: res.error || "Failed to log parsed score.",
      });
      return;
    }

    setStatusMsg({
      type: "success",
      text: `Logged ${parsed.spoilerStrippedSummary} → +${formatScore(
        norm.normalizedScore
      )} normalized pts!`,
    });
  };

  const handleClipboardRead = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        setStatusMsg({
          type: "error",
          text: "Your clipboard is empty. Copy a Wordle/Word500/Krillion share result or paste below.",
        });
        setIsOpen(true);
        return;
      }
      await handleParseAndLog(clipText);
    } catch {
      setIsOpen(true);
      setStatusMsg({
        type: "error",
        text: "Clipboard permission blocked by browser—paste your share block into the box below.",
      });
    }
  };

  return (
    <div className="rounded-xl border-2 border-wcag-border bg-wcag-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-wcag-border bg-wcag-elevated text-wcag-text"
            aria-hidden="true"
          >
            <ClipboardPaste className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-wcag-text">
              Share-Text Auto-Parser (Zero-Spoiler Guard)
            </h2>
            <p className="text-xs font-medium text-wcag-muted">
              Paste your Wordle, Word500, or Krillion emoji share string—extracts score &amp; strips spoilers automatically.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleClipboardRead}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-wcag-accent px-4 py-2 text-sm font-bold text-wcag-accentText hover:bg-wcag-accentHover"
          >
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
            <span>1-Click Paste from Clipboard</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            className="inline-flex min-h-[48px] items-center gap-1.5 rounded-lg border-2 border-wcag-border bg-wcag-elevated px-3.5 py-2 text-sm font-bold text-wcag-text hover:border-palette-shadow"
          >
            <span>{isOpen ? "Hide Paste Box" : "Manual Paste / Demo Samples"}</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 border-t border-wcag-border pt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="share-paste-box"
              className="text-xs font-bold text-wcag-text"
            >
              Paste Share Block (Emoji rows are immediately discarded on submit):
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleParseAndLog("Wordle 1,234 3/6*\n\n⬛🟨🟩⬛⬛\n🟩🟩🟩🟩🟩")
                }
                className="min-h-[36px] rounded border border-wcag-border bg-wcag-elevated px-2.5 py-1 text-xs font-bold text-wcag-text hover:border-palette-shadow"
              >
                Test Wordle 1,234 (3/6*)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleParseAndLog("Word500 #142 2/8\n🟢2 🟡1 🔴2\n🟢5 🟡0 🔴0")
                }
                className="min-h-[36px] rounded border border-wcag-border bg-wcag-elevated px-2.5 py-1 text-xs font-bold text-wcag-text hover:border-palette-shadow"
              >
                Test Word500 (2/8)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleParseAndLog("Krillion #88 - 325/700 pts (3,250m depth)")
                }
                className="min-h-[36px] rounded border border-wcag-border bg-wcag-elevated px-2.5 py-1 text-xs font-bold text-wcag-text hover:border-palette-shadow"
              >
                Test Krillion (325 pts)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <textarea
              id="share-paste-box"
              rows={2}
              value={rawPaste}
              onChange={(e) => setRawPaste(e.target.value)}
              placeholder="Paste e.g. Wordle 1,234 3/6* or Word500 #142 4/8 or Krillion 325/700..."
              className="flex-1 rounded-lg border-2 border-wcag-border bg-wcag-elevated p-3 font-mono text-base text-wcag-text placeholder:text-wcag-muted/70 focus:border-palette-shadow"
            />
            <button
              type="button"
              onClick={() => handleParseAndLog(rawPaste)}
              className="min-h-[48px] rounded-lg bg-wcag-accent px-5 py-2.5 text-sm font-bold text-wcag-accentText hover:bg-wcag-accentHover"
            >
              Extract &amp; Save
            </button>
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-wcag-muted">
            <ShieldAlert className="h-3.5 w-3.5 text-palette-shadow" aria-hidden="true" />
            <span>
              Spoiler Guard Active: Only the header line is parsed; emoji grids and words are discarded in memory.
            </span>
          </p>
        </div>
      )}

      {statusMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-3 flex items-center gap-2 rounded-lg border-2 p-3 text-sm font-bold text-white ${
            statusMsg.type === "success"
              ? "border-wcag-success bg-wcag-success"
              : "border-wcag-danger bg-wcag-danger"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}
    </div>
  );
}
