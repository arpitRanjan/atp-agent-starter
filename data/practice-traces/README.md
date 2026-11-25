# Practice traces (Chapter 2)

Made-up logs from a general-purpose agent like the one you will build: 400 users, 2,300 runs, 16,444 steps, between 1 October and 24 November 2026. They are shaped like real logs, with real problems hidden in them. Your job is to find them, by reading first and counting second.

## Load them

1. In your Supabase project, open the SQL editor and run `supabase/practice.sql`.
2. Open the Table Editor, then each practice table in turn (`practice_users`, `practice_runs`, `practice_steps`), choose Insert, then Import data from CSV, and pick the matching file from this folder.
3. Check the row counts: 400, 2,300 and 16,444.

## What is in them

| File | One row per | Columns |
| --- | --- | --- |
| `users.csv` | person | id, segment (student, pm, founder, analyst), country, signup date |
| `runs.csv` | task the agent worked on | who, when, the kind of task, the task text, model, source, status (done, partial, failed), steps, cost, duration |
| `steps.csv` | model call or tool call | which run, order, model or tool, tool name, time, tokens, cost, whether it failed, and the error |

## Before you write any SQL

Pick 20 runs and read every step of each, in order. Write one line per run on what went wrong, if anything. Then count.

At least one number you will be asked for comes out wrong if you query the table without thinking about what each row is. Finding it is part of the assignment.

`make_traces.py` rebuilds the three files exactly (it uses a fixed seed).
