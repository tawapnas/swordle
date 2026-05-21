-- Swordle — explicit day scheduling for the puzzle bank.
--
-- Adds a `sort_order` integer column the /admin UI controls. It is a contiguous,
-- 1-based sequence: puzzles sorted by `sort_order` ascending occupy day 1, 2, 3…
-- `sort_order` is SCHEDULING metadata, not puzzle content — it stays out of the
-- `Puzzle` union and the row<->puzzle mappers; the data-access layer owns it.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.
--
-- Run AFTER supabase/migrations/0003_puzzles.sql.

-- 1. Add the column (nullable for now so the backfill can run).
alter table public.puzzles add column if not exists sort_order integer;

-- 2. Backfill contiguously, 1-based, by current id order.
with ordered as (
  select id, row_number() over (order by id) as rn from public.puzzles
)
update public.puzzles p
   set sort_order = ordered.rn
  from ordered
 where p.id = ordered.id
   and p.sort_order is null;

-- 3. Lock it down: NOT NULL + unique. No column DEFAULT — the data layer always
--    sets `sort_order` explicitly. The constraint add is guarded so re-running
--    the migration doesn't error.
alter table public.puzzles alter column sort_order set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'puzzles_sort_order_key'
  ) then
    alter table public.puzzles
      add constraint puzzles_sort_order_key unique (sort_order);
  end if;
end $$;

-- 4. Scheduling functions. The service-role key bypasses RLS, so no
--    `security definer` is needed. Each does a SINGLE bulk UPDATE so the unique
--    constraint is only checked at statement end — never a transient duplicate.

-- Make room at `p_position` by shifting everything at/after it down one slot.
create or replace function public.puzzles_shift_for_insert(p_position integer)
returns void language plpgsql as $$
begin
  update public.puzzles
     set sort_order = sort_order + 1
   where sort_order >= p_position;
end;
$$;

-- Close the gap left by a deleted puzzle, keeping the sequence contiguous.
create or replace function public.puzzles_close_gap(p_deleted_order integer)
returns void language plpgsql as $$
begin
  update public.puzzles
     set sort_order = sort_order - 1
   where sort_order > p_deleted_order;
end;
$$;

-- Reschedule the whole bank: `p_ids` is the full list of puzzle ids in the
-- desired order, becoming sort_order 1, 2, 3… It must cover every puzzle.
create or replace function public.puzzles_reorder(p_ids text[])
returns void language plpgsql as $$
begin
  if array_length(p_ids, 1) is distinct from (
    select count(*)::int from public.puzzles
  ) then
    raise exception 'puzzles_reorder: p_ids must list every puzzle exactly once';
  end if;

  update public.puzzles p
     set sort_order = t.ord
    from (
      select unnest(p_ids) as id, generate_subscripts(p_ids, 1) as ord
    ) t
   where p.id = t.id;
end;
$$;
