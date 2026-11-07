# Word Games Hub & Equal-Weight Leaderboard

A real-time multiplayer daily word game tracking platform (Wordle, Word500, Krillion, Connections, Contexto, and custom daily games) where every game is deterministically normalized to a **0.00–100.00 scale** so every game carries equal weight.

Built with **Next.js 15 (App Router, TypeScript)**, **Tailwind CSS (WCAG 2.1 AA Okabe-Ito High-Contrast Palette)**, **Framer Motion**, and **Supabase (PostgreSQL + Auth + Realtime CDC)** with a built-in **Local Hybrid Demo Store** so it runs 100% interactively even before creating a Supabase account.

---

## Quick Start (Run Locally in 30 Seconds — No Accounts Needed!)

Because of the built-in **Hybrid Adapter** (`src/lib/supabase/repository.ts`), you can run and test the entire app immediately on your computer before setting up Supabase or Vercel.

### 1. Open your terminal in the project folder
```bash
cd /home/hamdaan_mirza/game_leaderboard_website
```

### 2. Install dependencies (if not already installed)
```bash
npm install
```

### 3. Start the development server
> **Tip:** If you ever had an old build cache, run `rm -rf .next` before starting.
```bash
npm run dev
```

### 4. Open in your browser
Visit **[http://localhost:3000](http://localhost:3000)**

### What to Try Locally in Interactive Demo Mode:
1. **Quick-Tap Score Entry (`/`)**:
   - Tap a pill button (`1`–`6` or `X`) on **Wordle** or (`1`–`8` or `X`) on **Word500** — no keyboard required!
   - Type `325` into the **Krillion** card to see the live preview (`= 46.43 normalized pts (3,250m)`) and click **Save**.
   - Watch the **Daily Standings** table immediately animate your rank shift (`▲ +2`).
2. **Share-Text Auto-Parser (`/`)**:
   - Click **"Manual Paste / Demo Samples"** in the Share-Text Auto-Parser bar and click **"Test Wordle 1,234 (3/6*)"** to see it extract the score and strip emoji spoilers.
3. **Simulate Live Friend Scores (`/`)**:
   - Click the **"Simulate Friend Score"** button at the top right of the Daily Standings table to simulate a friend submitting a score over WebSockets/BroadcastChannel.
4. **Switch Active Player Persona (Top Bar)**:
   - Use the **"Playing as: You (Alex)"** dropdown in the top navigation bar to switch to `Thabo M.`, `Naledi K.`, `Liam V.`, or `Zanele D.`.
5. **Edit & Audit Trail (`/`)**:
   - Click **"Edit Score"** on any completed card today, pick a new score, and scroll down to the **Same-Day Edit Audit Trail** to see the old vs. new score recorded.
6. **Add Custom Games (`/admin`)**:
   - Visit `/admin` and click **"+ Preset: Connections"** or **"+ Preset: Contexto"** to register a new daily game dynamically without code changes.

---

## Step-by-Step Guide: Setting Up Supabase (100% Free Tier)

When you are ready to connect a real cloud database so your friends can log in from their own phones, follow these steps:

### Step 1: Create a Free Supabase Account & Project
1. Go to **[https://supabase.com](https://supabase.com)** and click **Start your project**.
2. Sign up for free (using GitHub or your email — no credit card required).
3. Click **New Project**:
   - **Name**: `word-games-leaderboard`
   - **Database Password**: Generate a strong password and save it.
   - **Region**: Choose the region closest to your friend group (e.g., Europe / EU Central or AWS Cape Town if available).
   - Click **Create new project** and wait ~60 seconds for the database to finish provisioning.

### Step 2: Run the Database Schema & Seed SQL
1. In your Supabase project dashboard, look at the left sidebar and click **SQL Editor** (the `>_` icon).
2. Click **+ New query**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this project, copy the entire file contents, paste it into the Supabase SQL Editor, and click **Run** (bottom right).
   - *This creates all tables (`profiles`, `groups`, `group_members`, `games`, `submissions`, `submission_audit_logs`), the `BEFORE`/`AFTER` normalization & audit triggers, the `daily_leaderboard` and `all_time_leaderboard` views, RLS security policies, and Realtime WebSockets.*
4. Click **+ New query** again in the Supabase SQL Editor.
5. Open [`supabase/seed.sql`](./supabase/seed.sql), copy its contents, paste it into the editor, and click **Run**.
   - *This seeds **Wordle**, **Word500**, **Krillion**, and your default friend group (`WORDS2026`, timezone `Africa/Johannesburg`).*

### Step 3: Copy Your Supabase API Keys into `.env.local`
1. In the Supabase dashboard left sidebar, click **Project Settings** (the gear icon at the bottom) → **API**.
2. Copy the **Project URL** and the **`anon` `public` key**.
3. In your project folder, create a file named `.env.local` (or copy `.env.example` to `.env.local`):
   ```bash
   cp .env.example .env.local
   ```
4. Paste your keys into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_DEFAULT_GROUP_CODE=WORDS2026
   NEXT_PUBLIC_DEFAULT_TIMEZONE=Africa/Johannesburg
   ```
5. Restart `npm run dev` — the top badge will automatically switch from **"Interactive Demo Mode"** to **"Supabase Live"**!

---

## Step-by-Step Guide: Hosting on Vercel for Free

**Vercel** is the official creator of Next.js and hosts Next.js 15 apps for free with automatic HTTPS and a public shareable link.

### Step 1: Push Your Code to GitHub
1. Create a free account at **[https://github.com](https://github.com)** if you don't have one.
2. Click the **+** icon in the top-right corner of GitHub → **New repository**.
3. Name it `word-games-leaderboard`, set it to **Private** (or Public), and click **Create repository**.
4. In your project terminal, commit and push your code:
   ```bash
   git add .
   git commit -m "Initial full-stack Word Games Hub & Leaderboard"
   git branch -M main
   git remote add origin https://github.com/<your-github-username>/word-games-leaderboard.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel
1. Go to **[https://vercel.com](https://vercel.com)** and click **Sign Up** → **Continue with GitHub**.
2. Once logged in, click **Add New...** → **Project**.
3. Find your `word-games-leaderboard` repository and click **Import**.
4. Expand the **Environment Variables** section and add your keys (if using Supabase; if you want to deploy the Interactive Demo Mode first, you can leave them blank!):
   - `NEXT_PUBLIC_SUPABASE_URL` = *(your Supabase Project URL)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(your Supabase anon public key)*
   - `NEXT_PUBLIC_DEFAULT_GROUP_CODE` = `WORDS2026`
   - `NEXT_PUBLIC_DEFAULT_TIMEZONE` = `Africa/Johannesburg`
5. Click **Deploy**.
6. In ~60 seconds, Vercel will give you your live URL (e.g., `https://word-games-leaderboard.vercel.app`).

### Step 3: Add Your Vercel URL to Supabase Auth (For Magic Links)
1. Once you have your Vercel URL, go back to your **Supabase Dashboard** → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your Vercel URL (e.g., `https://word-games-leaderboard.vercel.app`).
3. Share the URL and invite code (`WORDS2026`) with your friend group on WhatsApp/Telegram!

---

## Running Automated Tests & Production Builds

```bash
# Run the 15 automated unit & end-to-end repository tests
npm test

# Build for production
npm run build

# Start production server locally
npm start
```

