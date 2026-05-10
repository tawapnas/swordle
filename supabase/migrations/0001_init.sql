-- Swordle — accounts, attempt history, streak summary.
--
-- Apply via the Supabase dashboard SQL editor, or `supabase db push` with the
-- Supabase CLI. Idempotent (safe to re-run).

-- ---------------------------------------------------------------------------
-- profiles — app-side extension of auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Create a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- attempts — one row per user per Swordle day (the daily mechanic is enforced
-- server-side by the unique constraint, not by the browser).
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  puzzle_id    text not null,
  day_number   integer not null,
  solved       boolean not null,
  time_ms      integer not null,
  attempted_at timestamptz not null default now(),
  unique (user_id, day_number)
);

create index if not exists attempts_user_id_idx    on public.attempts(user_id);
create index if not exists attempts_day_number_idx on public.attempts(day_number);

-- ---------------------------------------------------------------------------
-- user_streak_summary — derived stats for one user, computed from attempts.
--
-- A streak is a maximal run of consecutive day_numbers the user SOLVED (a failed
-- day breaks the run; a skipped day breaks the run). This returns:
--   current_streak         — length of the run ending on the user's most recent
--                            solved day. The API decides whether that run is
--                            still "live" by comparing last_solved_day_number to
--                            today's day_number (live iff >= today - 1).
--   longest_streak         — longest run ever.
--   total_solved           — count of solved attempts.
--   last_day_number        — most recent day the user attempted anything.
--   last_solved_day_number — most recent day the user solved.
-- Uses the classic "gaps and islands" trick: for consecutive integers,
-- (day_number - row_number()) is constant within a run.
-- ---------------------------------------------------------------------------
create or replace function public.user_streak_summary(p_user_id uuid)
returns table (
  current_streak         integer,
  longest_streak         integer,
  total_solved           integer,
  last_day_number        integer,
  last_solved_day_number integer
)
language sql
stable
as $$
  with solved as (
    select day_number
    from public.attempts
    where user_id = p_user_id and solved
  ),
  grouped as (
    select day_number,
           day_number - row_number() over (order by day_number) as grp
    from solved
  ),
  runs as (
    select grp, count(*)::int as len, max(day_number) as end_day
    from grouped
    group by grp
  )
  select
    coalesce((select len from runs order by end_day desc limit 1), 0),
    coalesce((select max(len) from runs), 0),
    (select count(*)::int from solved),
    (select max(day_number) from public.attempts where user_id = p_user_id),
    (select max(day_number) from solved);
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;

-- profiles: a user reads/updates only their own row.
-- (The admin dashboard reads everything via the service-role key, which bypasses RLS.)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- attempts: a user reads and inserts only their own rows. No updates, no deletes
-- (an attempt is immutable once recorded; the unique constraint makes the first
-- attempt of the day the one that counts).
drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own on public.attempts
  for select using (auth.uid() = user_id);

drop policy if exists attempts_insert_own on public.attempts;
create policy attempts_insert_own on public.attempts
  for insert with check (auth.uid() = user_id);
