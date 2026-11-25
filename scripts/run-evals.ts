// The eval runner, starter version.
//   npm run evals                                  runs evals/tasks.jsonl against http://localhost:3000
//   npm run evals -- --url=https://your-agent.vercel.app
//
// What it does today: signs in as an anonymous test user, sends every task to your
// agent, collects the streamed answer, and checks the simple rules (contains_any,
// number, must_not_contain). It prints a line for SCOREBOARD.md.
//
// What you will add: in Chapter 5, cost per task and a model judge for "judge" rules;
// in Chapter 8, checks on which tools were called, a check that every number in an
// answer came from a tool, pass^3 reliability, and a gate on every pull request.
// Until Chapter 5, only contains_any, number and must_not_contain rules can pass.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

type Task = { id: string; kind: string; task: string; rule: { contains_any?: string[]; number?: number; tolerance?: number; must_not_contain?: string[]; judge?: string } };

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const BASE = String(args.url ?? "http://localhost:3000");

async function testUserToken(): Promise<string> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.session) throw new Error(`Could not sign in the test user: ${error?.message}`);
  return data.session.access_token;
}

async function runTask(token: string, task: string): Promise<{ answer: string; events: { type: string; [k: string]: unknown }[]; ms: number }> {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/agent`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ task }) });
  if (!res.ok || !res.body) throw new Error(`The agent answered HTTP ${res.status}`);
  const events: { type: string; [k: string]: unknown }[] = [];
  const text = await res.text();
  for (const part of text.split("\n\n")) if (part.startsWith("data: ")) events.push(JSON.parse(part.slice(6)));
  const answer = events.filter((e) => e.type === "text_delta").map((e) => String(e.text)).join("");
  return { answer, events, ms: Date.now() - t0 };
}

function check(t: Task, answer: string): { passed: boolean; reason: string } {
  const r = t.rule;
  const lower = answer.toLowerCase();
  if (r.contains_any) return { passed: r.contains_any.some((s) => lower.includes(s.toLowerCase())), reason: "contains_any" };
  if (r.number !== undefined) {
    const nums = (answer.match(/-?\d[\d,]*\.?\d*/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
    return { passed: nums.some((n) => Math.abs(n - r.number!) <= (r.tolerance ?? 0)), reason: "number" };
  }
  if (r.must_not_contain) {
    const bad = r.must_not_contain.filter((s) => lower.includes(s.toLowerCase()));
    return { passed: bad.length === 0, reason: bad.length ? `said "${bad[0]}"` : "must_not_contain" };
  }
  return { passed: false, reason: "judge rules are not built yet (you add the judge in Chapter 5)" };
}

async function main() {
  const tasks: Task[] = fs.readFileSync("evals/tasks.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l));
  const token = await testUserToken();
  let pass = 0, totalMs = 0;
  for (const t of tasks) {
    try {
      const { answer, ms } = await runTask(token, t.task);
      const g = check(t, answer);
      if (g.passed) pass++;
      totalMs += ms;
      console.log(`${g.passed ? "PASS" : "FAIL"} ${t.id}  ${Math.round(ms / 1000)}s  ${g.reason}`);
    } catch (e) {
      console.log(`ERROR ${t.id}  ${(e as Error).message}`);
    }
  }
  const line = `| ${new Date().toISOString().slice(0, 10)} | | (what changed) | ${tasks.length} | ${pass}/${tasks.length} | (add cost in Ch 5) | ${Math.round(totalMs / tasks.length / 1000)}s |`;
  console.log(`\n${pass}/${tasks.length} passed. Add this line to SCOREBOARD.md:\n${line}`);
}
main();
