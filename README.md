# Word Games Hub & Equal-Weight Leaderboard

A real-time multiplayer daily word game tracking platform where friend groups asynchronously log their daily results across disparate word and trivia games (**Wordle**, **Word500**, **Krillion**, **Connections**, **Contexto**) and compete on dynamically recalculated **Daily** and **All-Time** leaderboards where every game carries equal weight.

---

## Core Engineering: The Equal-Weight Normalization Engine

Different word games measure success using incompatible scales and directions. Every raw score is converted on write (via a deterministic PostgreSQL `BEFORE INSERT OR UPDATE` trigger and shared TypeScript validator) to a standardized **0.00–100.00 scale**:

| Game | Metric / Direction | Raw Range | Formula / Mapping | Normalized Score |
| :--- | :--- | :--- | :--- | :--- |
| **Wordle** | Attempts (Lower is Better) | `1–6` Tries | Step Scale (`100, 90, 80, 65, 50, 35`) | `35.00 – 100.00` |
| **Wordle (Failed)** | Unsolved | `X` | Flat Participation Credit | `10.00` |
| **Word500** | Attempts (Lower is Better) | `1–8` Tries | $100 - ((\text{attempts} - 1) \times 11)$ | `23.00 – 100.00` |
| **Word500 (Failed)** | Unsolved | `X` | Flat Participation Credit | `10.00` |
| **Krillion** | Points (Higher is Better) | `0–700` Pts | $\text{ROUND}((\text{raw\_score} / 700.0) \times 100, 2)$ | `0.00 – 100.00` |
| **Custom Games** | Configurable (`ATTEMPTS` / `POINTS`) | `min..max` | Linear interpolation on `0.00–100.00` scale | `0.00 – 100.00` |

### Asynchronous Fairness & Metrics
- **Daily Standings**: Ranks players using PostgreSQL `DENSE_RANK() OVER (PARTITION BY play_date, group_id ORDER BY SUM(normalized_score) DESC, COUNT(game_id) DESC)` alongside **Average Score Per Game Played** so players who have only finished 1 of 3 games by midday can still compare efficiency fairly.
- **All-Time Hall of Fame**: Tracks **Cumulative Normalized Points**, **Career Mean Score per Game**, **Win Rate %**, **Completed-Day Crowns Won**, **Active Streaks**, and **Per-Game Specialty Badges**.
- **Same-Day Edit Window & Audit Trail**: Players can fix typos before `00:00:00` local time (`Africa/Johannesburg` SAST default); every update is recorded via an `AFTER UPDATE` audit trigger.

---

## Key Features

- **Quick-Tap Game Bento Grid**: 1-tap `48x48px` pill buttons for attempt-based games (no mobile keyboard required) and live normalized point previews for points-based games.
- **Zero-Spoiler Share-Text Auto-Parser**: Extracts puzzle numbers and scores directly from pasted Wordle, Word500, and Krillion share blocks while immediately discarding emoji grids in memory.
- **Realtime Leaderboard Shifts**: Powered by Supabase Realtime Change Data Capture (CDC) over WebSockets with Framer Motion layout animations (`prefers-reduced-motion` respected).
- **Dynamic Admin Game Registry**: Group admins can register or toggle new daily games (`scoring_type`, `min_score`, `max_score`) without code changes.
- **WCAG 2.1 AA / AAA Accessibility**:
  - **Typography**: **Atkinson Hyperlegible** & **Inter** paired with **JetBrains Mono** (`font-variant-numeric: tabular-nums`), strict `16px` minimum body text, `18px` mobile numeric inputs, and `48x48px` minimum touch targets.
  - **Complementary Dark & Light Palette**: Built around `#0D1321` (Midnight Navy), `#1D2D44` (Prussian Blue), `#3E5C76` (Paynes Steel), `#748CAB` (Shadow Slate), and `#F0EBD8` (Warm Eggshell) paired with colorblind-safe Okabe-Ito status badges and explicit directional icons (`▲ +2`, `▼ -1`, `✓ Done`).

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend & Database**: PostgreSQL (Supabase), Row-Level Security (RLS), PL/pgSQL Triggers & Window Views, Supabase Realtime WebSockets
- **Testing**: Vitest (Unit & End-to-End Repository Test Suites)

---

## Project Structure

```text
├── docs/                       # Architecture specification & implementation docs
├── supabase/
│   ├── schema.sql              # Tables, views, BEFORE/AFTER triggers, RLS, Realtime DDL
│   └── seed.sql                # Core games (Wordle, Word500, Krillion) & default group seed
├── src/
│   ├── app/                    # Next.js 15 App Router pages (/, /leaderboard, /admin, /login)
│   ├── components/
│   │   ├── admin/              # Dynamic game registry configuration form
│   │   ├── games/              # Bento grid, AttemptCard, PointsCard, ShareTextParser
│   │   ├── leaderboard/        # DailyStandings, AllTimeHall, AuditHistory
│   │   └── navigation/         # Persistent header, SAST reset timer & theme switcher
│   ├── lib/
│   │   ├── normalization.ts    # Deterministic 0-100 normalization & anti-cheat engine
│   │   ├── share-parser.ts     # Regex share-block parser with spoiler stripping
│   │   ├── timezone.ts         # Africa/Johannesburg (SAST / GMT+2) cutoff utilities
│   │   └── supabase/           # Supabase client & hybrid repository adapter
│   └── types/                  # TypeScript domain interfaces
└── tests/                      # Automated unit & integration tests
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local

# Run development server (http://localhost:3000)
npm run dev

# Run automated test suites
npm test

# Create production build
npm run build
```
