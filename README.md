# Build your own AI agent: the starter

This is where you build a general-purpose AI agent, one chapter at a time, in the [AllthingsPM](https://www.allthingspm.app) AI product management course. It plans, uses tools and skills, asks before anything risky, streams its work, remembers, and hands back a cited answer with a full trace.

You are the product manager of this build. An AI coding tool writes the code; you write the briefs, make every decision, check what comes back, and explain how it works. Nobody grades you on writing code. You are graded on your decisions and your understanding.

## What is already here, and what is yours to build

| Already here | Yours to build |
| --- | --- |
| The app shell in the AllthingsPM design, with light and dark mode | The agent loop, and the harness around it |
| Invisible sign-in: every visitor gets a private anonymous id, no login screen | The tools (web search, reading pages, running Python, files, documents) |
| A task box that streams an answer from `src/app/api/agent/route.ts` (a placeholder today) | The skills, and the loader that picks them |
| The starting database: `runs` and `steps` (`supabase/schema.sql`) | Plans, limits, approvals, questions, follow-ups, memory |
| The Chapter 1 notebook (`notebooks/01_meet_the_model.ipynb`) | Your task suite and its graders |
| Practice traces for Chapter 2 (`data/practice-traces/`) | Document search, the company connector, images and PDFs |
| Sample documents (`data/quillnote/`) and a made-up company, Northwind (`data/northwind/`) | The safety work |
| An eval runner to grow (`scripts/run-evals.ts`) | Every decision in `DECISIONS.md` |

## Chapter by chapter

| Chapter | You build | Where |
| --- | --- | --- |
| 1 | Meet the model; write the 20 tasks your agent must pass | `notebooks/01_meet_the_model.ipynb` (Colab) |
| 2 | Your database; read traces, then query them | `supabase/`, `data/practice-traces/` |
| 3 | Your live app, and the loop with one tool | `src/app/api/agent/route.ts`, then Vercel |
| 4 | Your first user and their jobs; agent or not | `AGENT-SPEC.md`, `DECISIONS.md` |
| 5 | The PRD, with tests against your live link | `PRD.md`, `evals/` |
| 6 | The harness and the skills | `src/lib/`, `skills/` |
| 7 | The agent screen people can follow, steer and trust | `src/app/page.tsx` |
| 8 | Evals you trust, and a gate on every change | `evals/`, `scripts/run-evals.ts` |
| 9 | Your documents, memory, privacy | new tables, a search tool |
| 10 | A real week with real users, and the numbers | SQL on your `steps` table |
| 11 | Your agent inside a company's systems | `data/northwind/` |
| 12 | Images, scanned PDFs, voice or another language | your choice |
| 13 | Safety: what it may do without asking, and attacks | `AUTHORITY.md` |
| 14 | A handoff someone else can run | `README.md` |
| 15 | The portfolio piece | `README.md`, `SCOREBOARD.md` |

A finished reference build of each chapter is live at [atp-agent.vercel.app](https://atp-agent.vercel.app): try it to see where you are heading.

## Set it up

You need free accounts on GitHub, Supabase and Vercel, and a Claude API key. Your agent's own calls cost about $5 over the whole course; Claude Code, the AI coding tool, runs on the same key and costs more (budget about $20 to $30 for the course, and watch the console's Usage page).

**Chapter 2: your copy and your database**

1. **Fork this repo** on GitHub (Fork, then Create fork). Your fork is public, which the grader needs.
2. **Create a Supabase project.** In its SQL editor, run `supabase/schema.sql`, then `supabase/practice.sql`, and load the practice traces (see `data/practice-traces/README.md`).

**Chapter 3: your live app**

3. **Add your Claude key as a Codespaces secret** at github.com/settings/codespaces (New secret, name `ANTHROPIC_API_KEY`, give your fork access), so Claude Code and the app both find it.
4. **Open your fork in a Codespace** (the green Code button, then Codespaces, then Create codespace on main). The packages and Claude Code install themselves.
5. **Turn on anonymous sign-ins** in Supabase: Authentication, Sign In / Providers, "Allow anonymous sign-ins".
6. **Add your keys.** Copy `.env.example` to `.env.local` and fill it in: from Supabase's Project Settings, the project URL (Data API) and the publishable and secret keys (API Keys). `.env.local` is never committed.
7. **Run it:** `npm run dev`, then open the forwarded port. Type a task: the placeholder answers.
8. **Check it:** `npm run build` must pass before you deploy.
9. **Deploy:** import your fork into Vercel and add the same keys under the project's Environment Variables.

Before you share your live link with anyone, read [SECURITY.md](SECURITY.md): with no login, every visitor can spend your model credit until you add limits.

## The files you keep

| File | What goes in it |
| --- | --- |
| `evals/tasks.jsonl` | your task suite, growing every chapter |
| `SCOREBOARD.md` | one line every time you run the suite |
| `DECISIONS.md` | every decision, with the number behind it |
| `BUILD-LOG.md` | what you asked the AI tool, what came back wrong, what you changed |
| `AGENT-SPEC.md` | the one-page spec, from Chapter 4 |
| `briefs/` | the brief you wrote before each piece of work |
| `stage-NN/EXPLAIN.md` | each chapter's explanations (start from `templates/EXPLAIN.md`) |

## Working with your AI coding tool

The course uses Claude Code: in your codespace's terminal, type `claude`, then describe the change you want (your brief). It reads the code, makes the change, and explains it; you read the change before keeping it. `AGENTS.md` holds the rules it follows in this repo (Claude Code reads it through `CLAUDE.md`; Copilot and Cursor, if you prefer them, read `AGENTS.md`). The short version: change files instead of rewriting them, explain every change, keep keys out of code, use the design tokens, and run the build before saying it is done.
