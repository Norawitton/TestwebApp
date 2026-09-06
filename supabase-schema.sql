-- ออมกัน (AomGun) — Supabase Schema
-- วิธีใช้: ไปที่ Supabase Dashboard → SQL Editor → วาง SQL นี้ทั้งหมด → กด Run

-- =====================
-- 1. Profiles
-- =====================
create table if not exists public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  name         text not null default 'ผู้ใช้ใหม่',
  email        text,
  phone        text,
  avatar_emoji text not null default '😊',
  pin_enabled        boolean not null default false,
  biometric_enabled  boolean not null default false,
  currency     text not null default 'THB',
  locale       text not null default 'th',
  onboarded    boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);

-- =====================
-- 2. Transactions
-- =====================
create table if not exists public.transactions (
  id         text primary key,
  user_id    uuid references auth.users on delete cascade not null,
  type       text not null,
  amount     numeric not null,
  merchant   text not null,
  category   text not null,
  account_id text not null,
  date       timestamptz not null,
  note       text,
  source     text not null,
  bank       text,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);

-- =====================
-- 3. Accounts
-- =====================
create table if not exists public.accounts (
  id         text primary key,
  user_id    uuid references auth.users on delete cascade not null,
  name       text not null,
  type       text not null,
  bank       text,
  last4      text,
  color_from text not null,
  color_to   text not null,
  created_at timestamptz not null default now()
);
alter table public.accounts enable row level security;
drop policy if exists "Users manage own accounts" on public.accounts;
create policy "Users manage own accounts" on public.accounts
  for all using (auth.uid() = user_id);

-- =====================
-- 4. Budgets
-- =====================
create table if not exists public.budgets (
  id                text primary key,
  user_id           uuid references auth.users on delete cascade not null,
  month             text not null,
  total_limit       numeric not null,
  category_limits   jsonb not null default '[]',
  alert_thresholds  jsonb not null default '[0.7, 0.9, 1.0]',
  created_at        timestamptz not null default now()
);
alter table public.budgets enable row level security;
drop policy if exists "Users manage own budgets" on public.budgets;
create policy "Users manage own budgets" on public.budgets
  for all using (auth.uid() = user_id);

-- =====================
-- 5. Saving Goals
-- =====================
create table if not exists public.saving_goals (
  id             text primary key,
  user_id        uuid references auth.users on delete cascade not null,
  name           text not null,
  target_amount  numeric not null,
  current_amount numeric not null default 0,
  deadline       text,
  emoji          text not null,
  color          text not null,
  created_at     timestamptz not null default now()
);
alter table public.saving_goals enable row level security;
drop policy if exists "Users manage own goals" on public.saving_goals;
create policy "Users manage own goals" on public.saving_goals
  for all using (auth.uid() = user_id);
