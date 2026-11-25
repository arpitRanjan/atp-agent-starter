<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rules for the AI coding tool working in this repo

This repo belongs to a product manager who is building a general-purpose AI agent, one chapter at a time, in the AllthingsPM course. They write the briefs and make the decisions; you write the code. Help them understand it.

1. **Change files, do not rewrite them.** Edit the smallest part that does the job. Never replace a whole file to add one thing (a rewrite of `next.config.ts` once deleted the styling setup).
2. **Explain every change** in plain words: what you changed, where (file and line), and how to check it worked. No jargon without a one-line meaning.
3. **Keys never go in code.** Read them from environment variables. Anything named `NEXT_PUBLIC_...` is visible to every visitor, so a secret never goes there.
4. **Use the design tokens** in `src/app/globals.css` (colours, fonts, spacing). Do not invent new colours or fonts.
5. **The product is the agent screen.** Do not add pages for traces, evals, scores or settings; those live in the database, the scripts and `SCOREBOARD.md`.
6. **Save every step.** Every model call and tool call is written to the `steps` table, so the person can read the trace with SQL.
7. **Approvals are enforced on the server**, never only by a button on the screen.
8. **Run `npm run build` and `npm run lint`** before saying something is done, and fix the cause of any error rather than silencing the rule.
9. **Ask before** deleting data, changing the database schema, or adding a paid service.
