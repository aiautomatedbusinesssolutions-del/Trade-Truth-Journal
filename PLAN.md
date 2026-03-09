# Trade Truth Journal — Implementation Plan
**Subtitle:** Stop Guessing. Start Journaling. Win Consistently.

## Context
Beginner traders treat wins as "good luck" and losses as "bad luck" because they have no record of their decision-making process. This app creates a structured journaling system that tracks the psychology and mindset behind every trade — not just the numbers. Over time, it identifies emotional and behavioral patterns that separate good decisions from good outcomes, acting as an AI-powered trading psychology coach.

## Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database & Auth:** Supabase (Postgres + email/password auth + RLS)
- **Styling:** Tailwind CSS (dark theme per sprint-rules.md)
- **AI:** Gemini 2.0 Flash (per-trade analysis), Gemini 2.5 Pro (deep pattern analysis after 10+ trades)
- **Price Data:** CoinGecko free API (crypto only)
- **Charts:** Recharts (lightweight)

---

## Directory Structure (Scaffolding Step)

```
trade-truth-journal/
├── .env.local                          # Supabase + Gemini + CoinGecko keys
├── .env.example                        # Template with placeholder values
├── next.config.js
├── tailwind.config.ts
├── package.json
├── PLAN.md
├── CODEX.md
├── sprint-rules.md
├── public/
│   └── favicon.ico
└── src/
    ├── app/
    │   ├── layout.tsx                  # Root layout: Inter font, dark bg, Providers
    │   ├── page.tsx                    # Landing / redirect to dashboard
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── signup/page.tsx
    │   ├── (protected)/
    │   │   ├── layout.tsx              # Auth guard, navbar
    │   │   ├── dashboard/page.tsx
    │   │   ├── trade/
    │   │   │   ├── new/page.tsx        # Pre-trade checklist + entry form
    │   │   │   ├── [id]/page.tsx       # Trade detail view
    │   │   │   ├── [id]/exit/page.tsx  # Exit form
    │   │   │   ├── [id]/analysis/page.tsx
    │   │   │   └── history/page.tsx    # All trades list
    │   │   └── insights/page.tsx       # Long-term pattern analysis
    │   └── api/
    │       ├── coingecko/search/route.ts
    │       ├── coingecko/price/route.ts
    │       ├── analysis/post-trade/route.ts
    │       ├── analysis/patterns/route.ts
    │       └── hindsight/route.ts
    ├── components/
    │   ├── ui/                         # Button, Card, Input, Modal, EmojiScale, Slider, Checkbox, Gauge
    │   ├── auth/AuthForm.tsx
    │   ├── trade/                      # PreTradeChecklist, TradeEntryForm, TradeExitForm, TradeCard, CoinSearch, PsychologyQuestions
    │   ├── analysis/                   # PostTradeReport, ProcessOutcomeMatrix, HindsightCard
    │   ├── dashboard/                  # StatsOverview, RecentTrades, PsychTrendChart, AlertsPanel, DecisionQualityGauge
    │   ├── insights/PatternReport.tsx
    │   └── layout/                     # Navbar, MobileNav, Providers
    ├── lib/
    │   ├── supabase/                   # client.ts, server.ts, middleware.ts
    │   ├── services/                   # coingecko.ts, gemini.ts, trades.ts, analysis.ts, hindsight.ts
    │   ├── utils/                      # calculations.ts, formatting.ts, constants.ts
    │   └── hooks/                      # useUser.ts, useTrades.ts, useCoinSearch.ts
    ├── types/                          # trade.ts, analysis.ts, coingecko.ts, database.ts
    └── middleware.ts                    # Next.js auth redirect middleware
```

---

## Database Schema

### `trades`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK auth.users, RLS |
| coin_id, coin_name, coin_symbol | text | CoinGecko data |
| trade_type | text | "long" / "short" |
| entry_price, position_size, stop_loss, take_profit | numeric | |
| idea_source | text | "own_analysis", "social_media", "friend_tip", "news", "other" |
| entry_mood, entry_energy, entry_confidence | int2 | 1-5 scales |
| entry_reasoning, entry_goal | text | Free text |
| external_pressure | text | "fomo", "revenge", "boredom", "tip", "none" |
| exit_price, exit_date, exit_reason | — | Nullable until closed |
| exit_mood, exit_energy, exit_confidence | int2 | Nullable |
| pnl_amount, pnl_percent | numeric | Auto-calc on exit |
| is_win | boolean | Set on exit |
| status | text | "open" / "closed" |
| checklist_id | uuid | FK checklist_entries |
| created_at, updated_at | timestamptz | |

### `checklist_entries`
7 boolean columns (higher_timeframes, news_check, calm_check, stop_loss_set, in_trading_plan, rr_defined, position_sized) + all_passed boolean.

### `trade_analyses`
Stores Gemini 2.0 Flash output: technical_summary, psychology_summary, process_rating ("good"/"bad"), outcome_rating ("win"/"loss"), matrix_label ("textbook"/"lucky"/"right_process"/"learning"), matrix_message, raw_response (jsonb).

### `hindsight_checks`
Per-trade rows for 24h, 7d, 30d: check_type, check_date, price_at_check, price_change_percent, is_completed.

### `pattern_analyses`
Gemini 2.5 Pro output: emotion_patterns (jsonb), behavior_patterns (jsonb), source_performance (jsonb), psychology_score (0-100), recommendations (text).

**RLS:** All tables enforce `auth.uid() = user_id` on all operations.

---

## Build Steps (10 Steps)

### Step 1: Scaffolding
- `create-next-app` with App Router, TypeScript, Tailwind, ESLint
- Configure Tailwind with Traffic Light palette + Inter font
- `globals.css` with `bg-slate-950` body
- Root layout with Inter font
- Hello World page with styled dark-mode card
- `.env.example` with placeholder keys
- Create directory structure (folders only, no empty files)
- **Verify:** Dev server runs, styled card visible. Output ASCII directory tree.

### Step 2: Supabase Setup & Authentication
- Supabase client (browser + server), middleware for auth redirects
- Auth pages: login + signup with email/password
- Protected route layout with auth guard + navbar
- Database migration: create all 5 tables + RLS policies
- **Verify:** Sign up → login → dashboard stub. Unauthenticated → redirect to login.

### Step 3: Pre-Trade Checklist
- 7 checklist items (higher timeframes, news, calm, stop-loss, trading plan, R:R, position size)
- All must be checked to proceed. Stores to `checklist_entries`.
- **Verify:** Can't continue until all 7 checked. Record appears in Supabase.

### Step 4: Trade Entry Form
- CoinGecko search/autocomplete (proxied through API route)
- Technical fields: coin, entry price, position size, type, stop-loss, take-profit, idea source
- Psychology questions: emoji mood, energy slider, confidence 1-5, reasoning, goal, external pressure
- Creates trade with status "open"
- **Verify:** Search coins, fill all fields, submit. Trade record in Supabase.

### Step 5: Trade Exit Form & P&L
- Exit form: exit price, exit reason, psychology questions at exit
- Auto-calculate P&L (amount + %), win/loss
- Create 3 hindsight_check rows (24h, 7d, 30d future dates)
- Trade detail view showing all entry data
- **Verify:** Closing trade shows correct P&L. Hindsight rows created.

### Step 6: Post-Trade Analysis (Gemini 2.0 Flash)
- Gemini wrapper for both models
- Post-trade API route: builds prompt with all trade + psychology data, calls Flash
- Process vs Outcome matrix (4 quadrants):
  - Won + good process = "Textbook trade"
  - Won + bad process = "Lucky — don't rely on this"
  - Lost + good process = "Right process, bad outcome"
  - Lost + bad process = "Learning opportunity"
- Analysis page with technical summary, psychology summary, matrix visual
- Auto-triggered on trade close
- **Verify:** After closing trade, analysis page shows all sections with correct matrix quadrant.

### Step 7: Dashboard
- Stats: win/loss count, win rate, total P&L, current streak
- Recent trades list (last 5)
- Decision Quality Gauge ("Aha moment"): good-process trades / total = score 0-100
  - Rose < 40, Amber 40-70, Emerald > 70
- Alerts panel (loss streak, hindsight updates)
- **Verify:** Dashboard loads with real data, gauge reflects actual trade quality.

### Step 8: Retrospective Price Checks (Hindsight)
- API route: fetch all due `hindsight_checks`, lookup CoinGecko price, update
- HindsightCard: "If you had held 24h/7d/30d, price would be $X (Y%)"
- Triggered on dashboard load (checks for any due entries)
- Shows on trade detail page + alerts panel
- **Verify:** 24h+ after closing a trade, hindsight card appears with real price data.

### Step 9: Loss Streak Alerts & Inactivity Nudges
- Modal component (dark-styled, overlay)
- On protected layout mount: check for 3+ consecutive losses → show warning modal
- Check for 7+ days since last trade → show "welcome back" nudge
- Loss streak modal: empathetic message about revenge trading, suggest a break
- **Verify:** 3 consecutive losing trades triggers modal. 7+ day gap triggers nudge.

### Step 10: Long-Term Pattern Analysis (Gemini 2.5 Pro) & Insights
- Patterns API route: sends ALL trades to Gemini 2.5 Pro for deep analysis
- Disabled until 10+ closed trades (with explanation message)
- Insights page: emotion patterns, behavioral insights, idea source rankings, recommendations
- Psychology trend chart (Recharts) on dashboard
- Trade history page with filters (win/loss, date range)
- **Verify:** With 10+ trades, generate analysis shows full pattern report. Chart renders on dashboard.

---

## Key Architectural Decisions
- **API routes as proxies** — All CoinGecko/Gemini calls go through Next.js API routes to keep keys server-side
- **Gemini model split** — Flash for per-trade (fast, cheap, every close), Pro for patterns (slower, richer, user-triggered)
- **Hindsight on dashboard load** — No cron job needed; checks for due entries when user visits
- **Process rating logic** — Good process = checklist passed, no FOMO/revenge pressure, clear reasoning, stop-loss set. Bad = pressure-driven, low confidence, no clear plan

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

## Verification
After each step, verify as described above. Full end-to-end test after Step 10:
1. Sign up → login
2. Complete checklist → enter trade → see it on dashboard
3. Close trade → see P&L + Gemini analysis + process/outcome matrix
4. Wait 24h (or mock) → see hindsight price check
5. Enter 3 losing trades → see loss streak warning
6. Enter 10+ trades → run pattern analysis → see insights page + trend chart
