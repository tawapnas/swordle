-- Swordle — collectible "swift" reward image per puzzle.
--
-- Adds a nullable `bird` column (1–9 → public/swift.00N.png) that the /admin UI
-- sets per puzzle. NULL means "derive a bird from the puzzle id" on the client.
-- This is puzzle CONTENT (unlike `sort_order`), so it round-trips through the
-- row<->puzzle mappers in lib/puzzle-row.ts.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.
-- Run AFTER supabase/migrations/0003_puzzles.sql.

alter table public.puzzles add column if not exists bird smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'puzzles_bird_range'
  ) then
    alter table public.puzzles
      add constraint puzzles_bird_range
      check (bird is null or (bird between 1 and 9));
  end if;
end $$;
