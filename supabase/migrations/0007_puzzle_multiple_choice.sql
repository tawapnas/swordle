-- Swordle — allow the `multiple-choice` puzzle type.
--
-- 0003_puzzles.sql constrained `type` to ('spot-bug', 'fill-modifier',
-- 'syntax-sort'). This adds 'multiple-choice' (a generic question with 4
-- localized choices, one correct — see lib/types.ts) so admin inserts and
-- the seed script can write it.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.

alter table public.puzzles
  drop constraint if exists puzzles_type_check;

alter table public.puzzles
  add constraint puzzles_type_check
  check (type in ('spot-bug', 'fill-modifier', 'syntax-sort', 'multiple-choice'));
