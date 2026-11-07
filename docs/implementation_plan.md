# Word Games Hub & Leaderboard — Implementation Plan & Completed Checklist

This plan translates the **[Word Games Leaderboard - Full-Stack Architecture & Implementation Plan.pdf](file:///home/hamdaan_mirza/game_leaderboard_website/docs/Word%20Games%20Leaderboard%20-%20Full-Stack%20Architecture%20&%20Implementation%20Plan.pdf)** and your 5 Senior Architect Refinements into the completed full-stack implementation.

---

## 1. Architectural Decisions & Refinements Applied

1. **Hybrid Adapter ([`src/lib/supabase/repository.ts`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/supabase/repository.ts))**:
   - Automatically detects `Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
   - Boots out-of-the-box with a seeded `localStorage` + `BroadcastChannel` realtime store (with 5 players, 3 completed historical SAST days, and partial today scores) and switches seamlessly to Supabase PostgreSQL + Realtime CDC when `.env.local` credentials are added.
2. **Multi-Group Isolation ([`supabase/schema.sql`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/schema.sql) & [`supabase/seed.sql`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/seed.sql))**:
   - Includes `groups` and `group_members` from Day 1, seeded with `invite_code: 'WORDS2026'` and `timezone: 'Africa/Johannesburg'`, pre-filled on [`/login`](file:///home/hamdaan_mirza/game_leaderboard_website/src/app/login/page.tsx).
3. **Refinement 1 — Supabase Realtime on Base Table**:
   - [`subscribeToLeaderboardUpdates()`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/supabase/repository.ts#L597-L638) subscribes to `postgres_changes` on the `submissions` base table (never on SQL `VIEW`s) and triggers a lightweight re-fetch of `daily_leaderboard` and `all_time_leaderboard`.
4. **Refinement 2 — Completed-Day Crowns Only**:
   - Both [`all_time_leaderboard`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/schema.sql#L254-L299) in SQL and [`getAllTimeLeaderboard()`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/supabase/repository.ts#L451-L580) filter `WHERE play_date < (CURRENT_TIMESTAMP AT TIME ZONE COALESCE(g.timezone, 'Africa/Johannesburg'))::DATE` so early-morning submissions on an unfinished day never prematurely award a Daily Crown.
5. **Refinement 3 — Split `BEFORE` and `AFTER` Triggers**:
   - `BEFORE INSERT OR UPDATE` (`trg_normalize_submission`) validates bounds, enforces the midnight SAST edit cutoff, and calculates `NEW.normalized_score`.
   - `AFTER UPDATE` (`trg_audit_submission_edit`) checks `OLD.raw_score IS DISTINCT FROM NEW.raw_score OR OLD.is_failed IS DISTINCT FROM NEW.is_failed` and logs to `submission_audit_logs`.
6. **Refinement 4 — Strict `raw_score` & `is_failed` Validation by `scoring_type`**:
   - Enforced in both [`trg_fn_normalize_submission()`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/schema.sql#L106-L133) and [`calculateNormalizedScore()`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/normalization.ts#L14-L66): `POINTS_HIGHER_BETTER` rejects `is_failed = true` or `raw_score = null`, while `ATTEMPTS_LOWER_BETTER` requires either `(is_failed = true AND raw_score IS NULL)` or `(is_failed = false AND raw_score BETWEEN min_score AND max_score)`.
7. **Refinement 5 — Share-Text Parser Spoiler Guard**:
   - [`parseGameShareText()`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/share-parser.ts#L16-L108) strips commas from puzzle numbers (`Wordle 1,234 3/6*`) and immediately discards all lines after the header line in memory so emoji grids or words are never stored.

---

## 2. Completed Master Todo Checklist

### Phase 1: Database Schema, Normalization Engine & Anti-Cheat (Backend/SQL)
- [x] **1.1 Create Database Schema ([`supabase/schema.sql`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/schema.sql))**
- [x] **1.2 Build Split Deterministic Normalization (`BEFORE`) & Audit (`AFTER`) Triggers**
- [x] **1.3 Create `daily_leaderboard` & Completed-Day Crown `all_time_leaderboard` Views**
- [x] **1.4 Configure Row-Level Security (RLS) & Seed Data ([`supabase/seed.sql`](file:///home/hamdaan_mirza/game_leaderboard_website/supabase/seed.sql))**

### Phase 2: Next.js 15 Scaffolding, WCAG 2.1 AA Design System & Authentication
- [x] **2.1 Initialize Next.js 15 Project & Dependencies ([`package.json`](file:///home/hamdaan_mirza/game_leaderboard_website/package.json))**
- [x] **2.2 Configure WCAG 2.1 AA Typography & Colorblind-Safe Palette ([`src/app/layout.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/app/layout.tsx), [`src/app/globals.css`](file:///home/hamdaan_mirza/game_leaderboard_website/src/app/globals.css))**
- [x] **2.3 Build Group Login & Persistent Navigation ([`src/app/login/page.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/app/login/page.tsx), [`src/components/navigation/Navbar.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/navigation/Navbar.tsx))**

### Phase 3: Quick-Entry Game Cards, Share Parser & Realtime Leaderboards
- [x] **3.1 Build Quick-Tap Game Bento Grid ([`AttemptCard.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/games/AttemptCard.tsx), [`PointsCard.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/games/PointsCard.tsx), [`GameBentoGrid.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/games/GameBentoGrid.tsx))**
- [x] **3.2 Build Share-Text Auto-Parser with Zero-Spoiler Guard ([`ShareTextParser.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/games/ShareTextParser.tsx), [`src/lib/share-parser.ts`](file:///home/hamdaan_mirza/game_leaderboard_website/src/lib/share-parser.ts))**
- [x] **3.3 Build Realtime Daily & All-Time Leaderboards ([`DailyStandings.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/leaderboard/DailyStandings.tsx), [`AllTimeHall.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/leaderboard/AllTimeHall.tsx), [`AuditHistory.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/leaderboard/AuditHistory.tsx))**
- [x] **3.4 Build Admin Game Configuration UI ([`GameConfigForm.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/components/admin/GameConfigForm.tsx), [`src/app/admin/page.tsx`](file:///home/hamdaan_mirza/game_leaderboard_website/src/app/admin/page.tsx))**

### Phase 4: Verification, Accessibility Audit & Deployment Readiness
- [x] **4.1 Unit & Integration Tests ([`tests/normalization.test.ts`](file:///home/hamdaan_mirza/game_leaderboard_website/tests/normalization.test.ts), [`tests/share-parser.test.ts`](file:///home/hamdaan_mirza/game_leaderboard_website/tests/share-parser.test.ts))**
- [x] **4.2 Production Build & WCAG 2.1 AA Verification**
