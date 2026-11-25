-- Practice tables for Chapter 2. Run this once, then import the three CSV files from
-- data/practice-traces/ into them (Table Editor, open the table, Insert, Import data from CSV).
-- These hold made-up traces from a general-purpose agent: read them, then query them.

create table if not exists practice_users (
  id text primary key,
  segment text,          -- student | pm | founder | analyst
  country text,
  signup_date date
);
create table if not exists practice_runs (
  id text primary key,
  user_id text,
  created_at timestamptz,
  task_kind text,
  task text,
  model text,
  source text,
  status text,           -- done | partial | failed
  steps_used int,
  cost_usd numeric(10,6),
  duration_ms int
);
create table if not exists practice_steps (
  run_id text,
  idx int,
  kind text,             -- model | tool
  name text,             -- the tool's name for tool steps
  ms int,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,6),
  is_error boolean,
  error_text text
);
-- Practice data is not personal to anyone, but keep the habit: no public access.
alter table practice_users enable row level security;
alter table practice_runs enable row level security;
alter table practice_steps enable row level security;
