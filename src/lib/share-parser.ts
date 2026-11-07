export interface ParsedShareResult {
  matched: boolean;
  gameSlug?: "wordle" | "word500" | "krillion" | string;
  puzzleNumber?: string;
  rawScore: number | null;
  isFailed: boolean;
  spoilerStrippedSummary?: string;
  error?: string;
}

/**
 * Share-Text Auto-Parser with Zero-Spoiler Guard (UC-03 & Refinement 5)
 * Extracts game type and score/attempt count from native emoji share strings
 * while immediately discarding emoji grids or word spoilers in memory.
 */
export function parseGameShareText(input: string): ParsedShareResult {
  if (!input || !input.trim()) {
    return {
      matched: false,
      rawScore: null,
      isFailed: false,
      error: "Please paste a valid share result block.",
    };
  }

  // Split into lines and inspect ONLY the non-empty header/score lines;
  // discard emoji rows so spoilers are never retained in state or logs.
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Check NYT Wordle format: e.g. "Wordle 1,234 3/6*" or "Wordle 1234 X/6"
  for (const line of lines.slice(0, 3)) {
    const cleanLine = line.replace(/,/g, "");
    const wordleMatch = cleanLine.match(/Wordle\s+(\d+)\s+([1-6Xx])\/6\*?/i);
    if (wordleMatch) {
      const puzzleNum = wordleMatch[1];
      const attemptToken = wordleMatch[2].toUpperCase();
      const isFailed = attemptToken === "X";
      const rawScore = isFailed ? null : parseInt(attemptToken, 10);

      return {
        matched: true,
        gameSlug: "wordle",
        puzzleNumber: puzzleNum,
        rawScore,
        isFailed,
        spoilerStrippedSummary: `Wordle #${puzzleNum}: ${isFailed ? "X/6 (Failed)" : `${rawScore}/6 tries`} (Emoji grid stripped for spoiler protection)`,
      };
    }
  }

  // 2. Check Word500 format: e.g. "Word500 #142 4/8" or "Word 500 1,024 X/8"
  for (const line of lines.slice(0, 3)) {
    const cleanLine = line.replace(/,/g, "");
    const word500Match = cleanLine.match(/Word\s*500\s*#?(\d+)?\s+([1-8Xx])\/8\*?/i);
    if (word500Match) {
      const puzzleNum = word500Match[1] || "Today";
      const attemptToken = word500Match[2].toUpperCase();
      const isFailed = attemptToken === "X";
      const rawScore = isFailed ? null : parseInt(attemptToken, 10);

      return {
        matched: true,
        gameSlug: "word500",
        puzzleNumber: puzzleNum,
        rawScore,
        isFailed,
        spoilerStrippedSummary: `Word500 #${puzzleNum}: ${isFailed ? "X/8 (Failed)" : `${rawScore}/8 tries`} (Count badges stripped for spoiler protection)`,
      };
    }
  }

  // 3. Check Krillion format: e.g. "Krillion #88 - 325 pts" or "Krillion: 325/700" or "3250m depth (325 pts)"
  for (const line of lines.slice(0, 4)) {
    const cleanLine = line.replace(/,/g, "");
    if (/krillion/i.test(cleanLine)) {
      // Match explicit X/700 or X pts
      const slashMatch = cleanLine.match(/(\d{1,3})\s*\/\s*700/);
      const ptsMatch = cleanLine.match(/(\d{1,3})\s*(?:pts|points|score)/i);
      const depthMatch = cleanLine.match(/(\d{1,4})\s*m(?:eters)?\b/i);
      const standaloneNum = cleanLine.replace(/krillion\s*#?\d*/i, "").match(/\b(\d{1,3})\b/);

      let extractedScore: number | null = null;
      if (slashMatch) {
        extractedScore = parseInt(slashMatch[1], 10);
      } else if (ptsMatch) {
        extractedScore = parseInt(ptsMatch[1], 10);
      } else if (depthMatch) {
        const meters = parseInt(depthMatch[1], 10);
        // In Krillion each point = 10 meters of depth (0..7000m -> 0..700 pts)
        extractedScore = meters > 700 ? Math.round(meters / 10) : meters;
      } else if (standaloneNum) {
        extractedScore = parseInt(standaloneNum[1], 10);
      }

      if (extractedScore !== null && extractedScore >= 0 && extractedScore <= 700) {
        return {
          matched: true,
          gameSlug: "krillion",
          rawScore: extractedScore,
          isFailed: false,
          spoilerStrippedSummary: `Krillion: ${extractedScore} / 700 pts (Details stripped for spoiler protection)`,
        };
      }
    }
  }

  return {
    matched: false,
    rawScore: null,
    isFailed: false,
    error:
      "Could not detect a valid Wordle (1-6/6), Word500 (1-8/8), or Krillion (0-700) header. Try pasting the full share block including the first title line.",
  };
}

