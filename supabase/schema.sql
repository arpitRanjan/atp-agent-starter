-- Your agent's database, as it starts. Run this once in the Supabase SQL editor (Chapter 2).
-- Every row belongs to a user, and row level security means people can read only their own.
-- The server writes with the secret key, which skips these rules.
-- You will add tables as the agent grows (files, notes, documents...). Each one is a decision:
-- what does it store, who can read it, how long is it kept?

-- One row per task the agent works on.
create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  task text not null,
  status text not null default 'running',
  messages jsonb not null default '[]',      -- the conversation the model sees, saved after every step
  steps_used int not null default 0,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cost_usd numeric(10,5) not null default 0,
  source text not null default 'app',        -- app | eval: keep test traffic out of your numbers
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per step: every model call and every tool call. This is the trace.
create table if not exists steps (
  id bigint generated always as identity primary key,
  run_id uuid not null references runs(id) on delete cascade,
  user_id uuid not null,
  idx int not null,
  kind text not null,                        -- model | tool | ...
  name text,
  input jsonb,
  output jsonb,
  input_tokens int default 0,
  output_tokens int default 0,
  cost_usd numeric(10,5) default 0,
  ms int default 0,
  created_at timestamptz not null default now()
);
create index if not exists steps_run_idx on steps(run_id, idx);

alter table runs enable row level security;
alter table steps enable row level security;
drop policy if exists "own runs" on runs;
create policy "own runs" on runs for select using (auth.uid() = user_id);
drop policy if exists "own steps" on steps;
create policy "own steps" on steps for select using (auth.uid() = user_id);

grant usage on schema public to anon, authenticated, service_role;
grant select on runs, steps to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
