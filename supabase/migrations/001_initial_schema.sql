-- ============================================
-- Trade Truth Journal — Initial Schema
-- ============================================

-- 1. Checklist Entries
create table public.checklist_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  higher_timeframes boolean not null default false,
  news_check boolean not null default false,
  calm_check boolean not null default false,
  stop_loss_set boolean not null default false,
  in_trading_plan boolean not null default false,
  rr_defined boolean not null default false,
  position_sized boolean not null default false,
  all_passed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Trades
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  coin_id text not null,
  coin_name text not null,
  coin_symbol text not null,
  trade_type text not null check (trade_type in ('long', 'short')),
  entry_price numeric not null,
  position_size numeric not null,
  stop_loss numeric,
  take_profit numeric,
  idea_source text not null check (idea_source in ('own_analysis', 'social_media', 'friend_tip', 'news', 'other')),
  entry_mood int2 not null check (entry_mood between 1 and 5),
  entry_energy int2 not null check (entry_energy between 1 and 5),
  entry_confidence int2 not null check (entry_confidence between 1 and 5),
  entry_reasoning text not null,
  entry_goal text not null,
  external_pressure text not null default 'none' check (external_pressure in ('fomo', 'revenge', 'boredom', 'tip', 'none')),
  exit_price numeric,
  exit_date timestamptz,
  exit_reason text,
  exit_mood int2 check (exit_mood between 1 and 5),
  exit_energy int2 check (exit_energy between 1 and 5),
  exit_confidence int2 check (exit_confidence between 1 and 5),
  pnl_amount numeric,
  pnl_percent numeric,
  is_win boolean,
  status text not null default 'open' check (status in ('open', 'closed')),
  checklist_id uuid references public.checklist_entries(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Trade Analyses
create table public.trade_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trade_id uuid references public.trades(id) on delete cascade not null unique,
  technical_summary text,
  psychology_summary text,
  process_rating text check (process_rating in ('good', 'bad')),
  outcome_rating text check (outcome_rating in ('win', 'loss')),
  matrix_label text check (matrix_label in ('textbook', 'lucky', 'right_process', 'learning')),
  matrix_message text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- 4. Hindsight Checks
create table public.hindsight_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trade_id uuid references public.trades(id) on delete cascade not null,
  check_type text not null check (check_type in ('24h', '7d', '30d')),
  check_date timestamptz not null,
  price_at_check numeric,
  price_change_percent numeric,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Pattern Analyses
create table public.pattern_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  emotion_patterns jsonb,
  behavior_patterns jsonb,
  source_performance jsonb,
  psychology_score int2 check (psychology_score between 0 and 100),
  recommendations text,
  created_at timestamptz not null default now()
);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.checklist_entries enable row level security;
alter table public.trades enable row level security;
alter table public.trade_analyses enable row level security;
alter table public.hindsight_checks enable row level security;
alter table public.pattern_analyses enable row level security;

-- Checklist Entries policies
create policy "Users can view own checklist entries"
  on public.checklist_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own checklist entries"
  on public.checklist_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checklist entries"
  on public.checklist_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own checklist entries"
  on public.checklist_entries for delete
  using (auth.uid() = user_id);

-- Trades policies
create policy "Users can view own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on public.trades for update
  using (auth.uid() = user_id);

create policy "Users can delete own trades"
  on public.trades for delete
  using (auth.uid() = user_id);

-- Trade Analyses policies
create policy "Users can view own trade analyses"
  on public.trade_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own trade analyses"
  on public.trade_analyses for insert
  with check (auth.uid() = user_id and exists (select 1 from public.trades t where t.id = trade_id and t.user_id = auth.uid()));

create policy "Users can update own trade analyses"
  on public.trade_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own trade analyses"
  on public.trade_analyses for delete
  using (auth.uid() = user_id);

-- Hindsight Checks policies
create policy "Users can view own hindsight checks"
  on public.hindsight_checks for select
  using (auth.uid() = user_id);

create policy "Users can insert own hindsight checks"
  on public.hindsight_checks for insert
  with check (auth.uid() = user_id and exists (select 1 from public.trades t where t.id = trade_id and t.user_id = auth.uid()));

create policy "Users can update own hindsight checks"
  on public.hindsight_checks for update
  using (auth.uid() = user_id);

create policy "Users can delete own hindsight checks"
  on public.hindsight_checks for delete
  using (auth.uid() = user_id);

-- Pattern Analyses policies
create policy "Users can view own pattern analyses"
  on public.pattern_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own pattern analyses"
  on public.pattern_analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pattern analyses"
  on public.pattern_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own pattern analyses"
  on public.pattern_analyses for delete
  using (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger for trades
-- ============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_trade_updated
  before update on public.trades
  for each row execute function public.handle_updated_at();
