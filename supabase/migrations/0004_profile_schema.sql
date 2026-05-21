-- Swordle — profile schema change: username / province / educational institution.
--
-- Replaces the original onboarding fields (first_name, last_name, team_name,
-- school) and the derived display_name with a simpler set: a unique username,
-- the user's Thailand province, and an optional educational institution.
-- "Onboarded" now means username and province are both set.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.

alter table public.profiles
  add column if not exists username                text,
  add column if not exists province                text,
  add column if not exists educational_institution text;

-- Carry a name forward for anyone who already onboarded under the old schema,
-- so they keep their username (they'll still be asked for a province).
update public.profiles
  set username = display_name
  where username is null and display_name is not null and display_name <> '';

-- Usernames are unique, case-insensitively. NULLs are allowed and don't collide
-- (a fresh profile row from the signup trigger has no username yet).
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

alter table public.profiles
  drop column if exists first_name,
  drop column if exists last_name,
  drop column if exists team_name,
  drop column if exists school,
  drop column if exists display_name;
