-- Swordle — puzzle bank.
--
-- data/puzzles.json stays the source of truth when Supabase is NOT configured;
-- when it IS, this table is authoritative and the /admin UI writes to it.
-- Seed it from the JSON with `npm run seed:puzzles`.
--
-- Apply via the Supabase dashboard SQL editor or `supabase db push`. Idempotent.
--
-- SECURITY: rows carry the puzzle `answer`. Row-Level Security is enabled with
-- NO select policy for anon/authenticated — only the service-role key (which
-- bypasses RLS) may read this table. Server code reads it via the admin client;
-- answers are stripped by toPublicPuzzle before anything reaches the client.

create table if not exists public.puzzles (
  id           text primary key,
  type         text not null check (type in ('spot-bug', 'fill-modifier', 'syntax-sort')),
  prompt       jsonb not null,         -- { "en": "...", "th": "..." }
  difficulty   integer not null check (difficulty in (1, 2, 3)),
  payload      jsonb not null,         -- type-specific shape (see lib/types.ts)
  answer       jsonb not null,         -- type-specific shape
  explanation  jsonb not null,         -- { "en": "...", "th": "..." }
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists puzzles_type_idx on public.puzzles(type);

-- Keep updated_at fresh on UPDATE.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists puzzles_touch_updated_at on public.puzzles;
create trigger puzzles_touch_updated_at
  before update on public.puzzles
  for each row execute function public.touch_updated_at();

-- RLS on, no policies => the table is reachable only via the service-role key.
alter table public.puzzles enable row level security;
-- (deliberately no `create policy` statements)
