import { describe, expect, it } from "vitest";
import { parseGameShareText } from "../src/lib/share-parser";

describe("Share-Text Auto-Parser & Spoiler Guard (UC-03, Refinement 5)", () => {
  it("parses NYT Wordle share strings with comma-formatted puzzle numbers and strips emoji grids", () => {
    const share = "Wordle 1,234 3/6*\n\n⬛🟨🟩⬛⬛\n🟩🟩🟩🟩🟩";
    const res = parseGameShareText(share);
    expect(res.matched).toBe(true);
    expect(res.gameSlug).toBe("wordle");
    expect(res.puzzleNumber).toBe("1234");
    expect(res.rawScore).toBe(3);
    expect(res.isFailed).toBe(false);
    expect(res.spoilerStrippedSummary).not.toContain("🟩");
  });

  it("parses failed Wordle X/6 share string", () => {
    const share = "Wordle 998 X/6\n⬛⬛⬛⬛⬛";
    const res = parseGameShareText(share);
    expect(res.matched).toBe(true);
    expect(res.gameSlug).toBe("wordle");
    expect(res.rawScore).toBeNull();
    expect(res.isFailed).toBe(true);
  });

  it("parses Word500 share blocks", () => {
    const share = "Word500 #142 4/8\n🟢2 🟡1 🔴2\n🟢5 🟡0 🔴0";
    const res = parseGameShareText(share);
    expect(res.matched).toBe(true);
    expect(res.gameSlug).toBe("word500");
    expect(res.rawScore).toBe(4);
    expect(res.isFailed).toBe(false);
    expect(res.spoilerStrippedSummary).not.toContain("🟢");
  });

  it("parses Krillion share blocks", () => {
    const share = "Krillion #88 - 325/700 pts (3,250m depth)";
    const res = parseGameShareText(share);
    expect(res.matched).toBe(true);
    expect(res.gameSlug).toBe("krillion");
    expect(res.rawScore).toBe(325);
    expect(res.isFailed).toBe(false);
  });
});

