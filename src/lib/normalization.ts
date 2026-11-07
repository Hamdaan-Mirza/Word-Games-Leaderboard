import { GameConfig } from "@/types/leaderboard";

export interface NormalizationResult {
  valid: boolean;
  normalizedScore: number;
  sanitizedRawScore: number | null;
  error?: string;
}

/**
 * Deterministic Equal-Weight Score Normalization Engine (0.00 to 100.00 scale)
 * Matches PostgreSQL trigger `trg_fn_normalize_submission()` 1-to-1.
 */
export function calculateNormalizedScore(
  game: Pick<GameConfig, "slug" | "name" | "scoring_type" | "min_score" | "max_score">,
  rawScore: number | null,
  isFailed: boolean
): NormalizationResult {
  // Refinement 4: Explicit validation of scoring_type vs is_failed and raw_score
  if (game.scoring_type === "POINTS_HIGHER_BETTER") {
    if (isFailed) {
      return {
        valid: false,
        normalizedScore: 0,
        sanitizedRawScore: null,
        error: `${game.name} is points-based and cannot be marked as Failed (X). Enter 0 for zero points.`,
      };
    }
    if (rawScore === null || rawScore === undefined || Number.isNaN(rawScore)) {
      return {
        valid: false,
        normalizedScore: 0,
        sanitizedRawScore: null,
        error: `Please enter a numeric score between ${game.min_score} and ${game.max_score} for ${game.name}.`,
      };
    }
    if (!Number.isInteger(rawScore) || rawScore < game.min_score || rawScore > game.max_score) {
      return {
        valid: false,
        normalizedScore: 0,
        sanitizedRawScore: null,
        error: `${game.name} score must be a whole number between ${game.min_score} and ${game.max_score}.`,
      };
    }
  } else {
    // ATTEMPTS_LOWER_BETTER
    if (isFailed) {
      if (rawScore !== null && rawScore !== undefined) {
        return {
          valid: false,
          normalizedScore: 0,
          sanitizedRawScore: null,
          error: `When ${game.name} is marked as Failed (X), raw_score must be null.`,
        };
      }
      return {
        valid: true,
        normalizedScore: 10.0, // Flat participation credit
        sanitizedRawScore: null,
      };
    }

    if (rawScore === null || rawScore === undefined || Number.isNaN(rawScore)) {
      return {
        valid: false,
        normalizedScore: 0,
        sanitizedRawScore: null,
        error: `Please select an attempt count between ${game.min_score} and ${game.max_score}, or X (Failed).`,
      };
    }

    if (!Number.isInteger(rawScore) || rawScore < game.min_score || rawScore > game.max_score) {
      return {
        valid: false,
        normalizedScore: 0,
        sanitizedRawScore: null,
        error: `${game.name} attempts must be between ${game.min_score} and ${game.max_score} (or X for failed).`,
      };
    }
  }

  // Deterministic formula by game slug
  const slug = game.slug.toLowerCase();

  if (slug === "wordle") {
    const wordleStepMap: Record<number, number> = {
      1: 100.0,
      2: 90.0,
      3: 80.0,
      4: 65.0,
      5: 50.0,
      6: 35.0,
    };
    const score = wordleStepMap[rawScore!] ?? 10.0;
    return {
      valid: true,
      normalizedScore: Number(score.toFixed(2)),
      sanitizedRawScore: rawScore!,
    };
  }

  if (slug === "word500") {
    // Formula: 100 - ((attempts - 1) * 11)
    const score = 100 - (rawScore! - 1) * 11;
    return {
      valid: true,
      normalizedScore: Number(score.toFixed(2)),
      sanitizedRawScore: rawScore!,
    };
  }

  if (slug === "krillion") {
    // Formula: ROUND((raw_score / 700.0) * 100, 2)
    const score = Math.round(((rawScore! / 700.0) * 100.0 + Number.EPSILON) * 100) / 100;
    return {
      valid: true,
      normalizedScore: Number(score.toFixed(2)),
      sanitizedRawScore: rawScore!,
    };
  }

  // Generic fallback for Admin-configured custom games (UC-06)
  if (game.scoring_type === "POINTS_HIGHER_BETTER") {
    if (game.max_score === game.min_score) {
      return { valid: true, normalizedScore: 100.0, sanitizedRawScore: rawScore! };
    }
    const ratio = (rawScore! - game.min_score) / (game.max_score - game.min_score);
    const score = Math.round((ratio * 100.0 + Number.EPSILON) * 100) / 100;
    return {
      valid: true,
      normalizedScore: Number(score.toFixed(2)),
      sanitizedRawScore: rawScore!,
    };
  } else {
    // ATTEMPTS_LOWER_BETTER generic linear scale (100 down to 25 for solved, 10 for X)
    if (game.max_score === game.min_score) {
      return { valid: true, normalizedScore: 100.0, sanitizedRawScore: rawScore! };
    }
    const ratio = (rawScore! - game.min_score) / (game.max_score - game.min_score);
    const score = Math.round((100.0 - ratio * 75.0 + Number.EPSILON) * 100) / 100;
    return {
      valid: true,
      normalizedScore: Number(score.toFixed(2)),
      sanitizedRawScore: rawScore!,
    };
  }
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}

