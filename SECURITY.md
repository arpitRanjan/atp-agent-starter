# Keeping your agent and your keys safe

## Your keys

- Keys live in `.env.local` on your machine and in your host's settings (Vercel, Environment Variables). Never in code, never in a commit, never in a notebook cell, never in a chat with an AI tool.
- `.gitignore` already keeps every `.env*` file out of git, except `.env.example`, which holds names only.
- Anything named `NEXT_PUBLIC_...` is sent to every visitor's browser. The publishable Supabase key is designed for that; the **secret** key and the Claude key must never have that prefix.
- `src/lib/db.ts` holds the secret key and starts with `import "server-only"`, so the build fails if a page that runs in the browser ever imports it. Keep that line.
- GitHub scans public repos for leaked keys, but do not rely on it.

## If a key leaks

Assume it is used within minutes. Revoke it and make a new one (Claude console, Supabase API Keys, Tavily dashboard), update `.env.local` and Vercel, then redeploy. Deleting the commit is not enough: the old key is still in the history and in every fork.

## Before you share your live link

Your agent has no login (every visitor gets an anonymous id), and every task costs you money once it calls a model. Before you post the link anywhere public:

1. **Limit use:** tasks per visitor per day, per network address per day, and a total daily spend cap for the whole site (Chapter 13 builds these).
2. **Cap each task:** a step limit and a spend limit, enforced in code (Chapter 6).
3. **Set a spending limit** in the Claude console as a last line of defence.
4. **Check your database rules:** every table has row level security on, and a query made with the publishable key returns none of anyone's rows.
5. **Consider a CAPTCHA** on anonymous sign-ins (Supabase, Authentication, Attack Protection) if you see abuse.

## Agents read untrusted text

Web pages, documents and tool results can contain instructions aimed at your agent. Treat them as data, never as commands: approvals for anything that writes or sends, no way for the agent to carry data out, and the safety tests in Chapter 13.
