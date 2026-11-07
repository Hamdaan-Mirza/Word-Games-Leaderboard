"use client";

import React from "react";
import { History, ArrowRight } from "lucide-react";
import { SubmissionAuditLog } from "@/types/leaderboard";
import { formatScore } from "@/lib/normalization";

interface AuditHistoryProps {
  logs: SubmissionAuditLog[];
}

export function AuditHistory({ logs }: AuditHistoryProps) {
  return (
    <section
      aria-label="Same-Day Score Edit Audit Trail"
      className="rounded-xl border-2 border-wcag-border bg-wcag-surface p-5 shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <History className="h-5 w-5 text-palette-shadow" aria-hidden="true" />
        <h3 className="text-lg font-extrabold text-wcag-text">
          Same-Day Edit Audit Trail (Anti-Tamper Log)
        </h3>
      </div>
      <p className="mt-1 text-sm text-wcag-muted">
        Players can fix typos (e.g., mistyping 352 instead of 325) before 00:00:00 SAST. Every modification is automatically recorded by the{" "}
        <code className="rounded border border-wcag-border bg-wcag-elevated px-1.5 py-0.5 font-mono text-xs font-bold text-wcag-text">
          AFTER UPDATE
        </code>{" "}
        trigger to keep friends honest.
      </p>

      {logs.length === 0 ? (
        <div className="mt-4 rounded-lg border border-wcag-border bg-wcag-elevated p-4 text-sm font-semibold text-wcag-muted">
          No score edits have been made yet today. Try editing one of your logged game cards to see the audit trigger in action!
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-wcag-border bg-wcag-elevated px-4 py-3 text-sm"
            >
              <div>
                <span className="font-extrabold text-wcag-text">
                  {log.display_name}
                </span>{" "}
                <span className="text-wcag-muted">edited</span>{" "}
                <span className="font-extrabold underline decoration-palette-shadow underline-offset-4 text-wcag-text">
                  {log.game_name}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-sm font-bold tabular-nums">
                <span className="rounded border border-wcag-border bg-wcag-surface px-2.5 py-0.5 text-wcag-muted">
                  {log.previous_is_failed
                    ? "Failed (X)"
                    : `Raw ${log.previous_raw_score}`}{" "}
                  ({formatScore(Number(log.previous_normalized_score))} pts)
                </span>
                <ArrowRight className="h-4 w-4 text-wcag-muted" aria-hidden="true" />
                <span className="rounded bg-wcag-success px-2.5 py-0.5 text-white">
                  {log.new_is_failed
                    ? "Failed (X)"
                    : `Raw ${log.new_raw_score}`}{" "}
                  ({formatScore(Number(log.new_normalized_score))} pts)
                </span>
              </div>

              <span className="font-mono text-xs text-wcag-muted">
                {new Date(log.changed_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
