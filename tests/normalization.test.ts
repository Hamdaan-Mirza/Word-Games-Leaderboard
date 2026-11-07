import { describe, expect, it } from "vitest";
import { calculateNormalizedScore } from "../src/lib/normalization";
import { SEED_GAMES } from "../src/lib/supabase/repository";

const wordle = SEED_GAMES[0];
const word500 = SEED_GAMES[1];
const krillion = SEED_GAMES[2];

describe("Equal-Weight Score Normalization Engine & Anti-Cheat (FR-4, FR-7, Refinement 4)", () => {
  it("normalizes Wordle 1..6 tries and X/fail accurately", () => {
    expect(calculateNormalizedScore(wordle, 1, false).normalizedScore).toBe(100.0);
    expect(calculateNormalizedScore(wordle, 2, false).normalizedScore).toBe(90.0);
    expect(calculateNormalizedScore(wordle, 3, false).normalizedScore).toBe(80.0);
    expect(calculateNormalizedScore(wordle, 4, false).normalizedScore).toBe(65.0);
    expect(calculateNormalizedScore(wordle, 5, false).normalizedScore).toBe(50.0);
    expect(calculateNormalizedScore(wordle, 6, false).normalizedScore).toBe(35.0);
    expect(calculateNormalizedScore(wordle, null, true).normalizedScore).toBe(10.0);
  });

  it("rejects out-of-range Wordle inputs and non-null raw_score when is_failed=true", () => {
    expect(calculateNormalizedScore(wordle, 0, false).valid).toBe(false);
    expect(calculateNormalizedScore(wordle, 7, false).valid).toBe(false);
    expect(calculateNormalizedScore(wordle, 3, true).valid).toBe(false);
  });

  it("normalizes Word500 1..8 tries via 100 - ((attempts - 1) * 11) and X=10", () => {
    expect(calculateNormalizedScore(word500, 1, false).normalizedScore).toBe(100.0);
    expect(calculateNormalizedScore(word500, 2, false).normalizedScore).toBe(89.0);
    expect(calculateNormalizedScore(word500, 3, false).normalizedScore).toBe(78.0);
    expect(calculateNormalizedScore(word500, 4, false).normalizedScore).toBe(67.0);
    expect(calculateNormalizedScore(word500, 5, false).normalizedScore).toBe(56.0);
    expect(calculateNormalizedScore(word500, 6, false).normalizedScore).toBe(45.0);
    expect(calculateNormalizedScore(word500, 7, false).normalizedScore).toBe(34.0);
    expect(calculateNormalizedScore(word500, 8, false).normalizedScore).toBe(23.0);
    expect(calculateNormalizedScore(word500, null, true).normalizedScore).toBe(10.0);
  });

  it("rejects out-of-range Word500 inputs", () => {
    expect(calculateNormalizedScore(word500, 0, false).valid).toBe(false);
    expect(calculateNormalizedScore(word500, 9, false).valid).toBe(false);
  });

  it("normalizes Krillion 0..700 points via ROUND((raw_score / 700.0) * 100, 2)", () => {
    // PDF Section 2 Example: 325 -> 46.43
    expect(calculateNormalizedScore(krillion, 325, false).normalizedScore).toBe(46.43);
    expect(calculateNormalizedScore(krillion, 700, false).normalizedScore).toBe(100.0);
    expect(calculateNormalizedScore(krillion, 0, false).normalizedScore).toBe(0.0);
    expect(calculateNormalizedScore(krillion, 350, false).normalizedScore).toBe(50.0);
  });

  it("enforces Refinement 4: rejects is_failed=true or out-of-range on Krillion", () => {
    expect(calculateNormalizedScore(krillion, null, true).valid).toBe(false);
    expect(calculateNormalizedScore(krillion, 0, true).valid).toBe(false);
    expect(calculateNormalizedScore(krillion, -1, false).valid).toBe(false);
    expect(calculateNormalizedScore(krillion, 701, false).valid).toBe(false);
  });
});

