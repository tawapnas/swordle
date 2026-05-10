-- Swordle — profile onboarding fields.
--
-- After first sign-in, the app asks the user for their name, (optional) team,
-- and school before letting them play. These columns hold that. The required
-- ones (first_name, last_name, school) being non-null is what "onboarded" means.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists team_name  text,
  add column if not exists school     text;

-- The onboarding form writes the user's own profile row. The signup trigger from
-- 0001 already creates that row, but allow an insert-own as a safety net (e.g. if
-- the row is ever missing) so an upsert from the user's session works.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
