// Chapter 1: meet the bare model, and write the test your agent must pass.
// Everything here is already written: you run it and change the values in
// stage-01/experiments.json and evals/tasks.jsonl. Results are saved into
// stage-01/ so they live in your repo, where the grader reads them.
//
//   npm run model:test                       one tiny call: is the key working?
//   npm run model:try                        the 10 calls in stage-01/experiments.json -> stage-01/usage.md
//   npm run model:ask -- "your question" [--model=claude-sonnet-5-5] [--effort=low|medium|high]
//                        [--max-tokens=2000] [--no-thinking] [--stream] [--system="..."]
//   npm run model:suite -- --runs=5          every task in evals/tasks.jsonl on the bare model (no tools),
//                                            on two models -> stage-01/suite.md and stage-01/probe_runs.csv
//   npm run calc -- "1240 * (1 - 0.035) ** 6 * 12"   work out an expected number with code, never in your head
//
// The key comes from the ANTHROPIC_API_KEY environment variable (your
// Codespaces secret), never from a file you commit.
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { costUsd } from "../src/lib/prices";

type Effort = "low" | "medium" | "high";
type Call = { prompt: string; system?: string; model?: string; effort?: Effort; thinking?: boolean; max_tokens?: number; stream?: boolean };
type Result = { model: string; effort: Effort; thinking: boolean; max_tokens: number; stop_reason: string; tokens_in: number; tokens_out: number; seconds: number; first_word_seconds: number | null; cost_usd: number; answer: string };
type Task = { id: string; kind: string; task: string; rule: { contains_any?: string[]; number?: number; tolerance?: number; must_not_contain?: string[]; judge?: string } };

const DIR = "stage-01";
const MODELS = ["claude-haiku-5-5", "claude-sonnet-5-5"];
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name: string) => {
  const a = args.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  return a === undefined ? undefined : a.includes("=") ? a.slice(a.indexOf("=") + 1) : "true";
};

function client() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("No ANTHROPIC_API_KEY found. Add it as a Codespaces secret (github.com/settings/codespaces), give your fork access, then restart the codespace.");
    process.exit(1);
  }
  return new Anthropic();
}

async function ask(c: Call, show = true): Promise<Result> {
  const model = c.model ?? MODELS[0];
  const effort = c.effort ?? "medium";
  const thinking = c.thinking ?? true;
  const max_tokens = c.max_tokens ?? 2000;
  const params = {
    model, max_tokens, system: c.system ?? "You are a helpful assistant.",
    messages: [{ role: "user" as const, content: c.prompt }],
    thinking: thinking ? { type: "adaptive" as const, display: "summarized" as const } : { type: "disabled" as const },
    output_config: { effort },
  };
  const t0 = Date.now();
  let first: number | null = null;
  let msg: Anthropic.Message;
  if (c.stream) {
    const s = client().messages.stream(params as never);
    s.on("text", (t: string) => {
      if (first === null) first = (Date.now() - t0) / 1000;
      if (show) process.stdout.write(t);
    });
    msg = await s.finalMessage();
    if (show) process.stdout.write("\n");
  } else {
    msg = await client().messages.create(params as never);
  }
  const answer = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  if (show && !c.stream) console.log(answer);
  return {
    model, effort, thinking, max_tokens, stop_reason: String(msg.stop_reason),
    tokens_in: msg.usage.input_tokens, tokens_out: msg.usage.output_tokens,
    seconds: Math.round((Date.now() - t0) / 10) / 100, first_word_seconds: first,
    cost_usd: Math.round(costUsd(model, msg.usage) * 1e6) / 1e6, answer,
  };
}

const table = (head: string[], rows: (string | number | boolean | null)[][]) =>
  [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map((v) => String(v ?? "").replace(/\|/g, "/").replace(/\n/g, " ")).join(" | ")} |`)].join("\n");
const csv = (rows: Record<string, unknown>[]) => {
  const head = Object.keys(rows[0] ?? {});
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [head.join(","), ...rows.map((r) => head.map((h) => cell(r[h])).join(","))].join("\n") + "\n";
};
const today = () => new Date().toISOString().slice(0, 10);

function numbersIn(text: string) {
  return [...text.matchAll(/-?\d[\d,]*\.?\d*/g)].map((m) => Number(m[0].replace(/,/g, ""))).filter((n) => !Number.isNaN(n));
}

async function check(t: Task, answer: string): Promise<{ passed: boolean; reason: string; judge_cost_usd: number }> {
  const r = t.rule;
  if (r.contains_any) { const ok = r.contains_any.some((s) => answer.toLowerCase().includes(s.toLowerCase())); return { passed: ok, reason: ok ? "contains" : "missing expected words", judge_cost_usd: 0 }; }
  if (r.number !== undefined) { const ok = numbersIn(answer).some((n) => Math.abs(n - r.number!) <= (r.tolerance ?? 0)); return { passed: ok, reason: ok ? "number ok" : "number wrong or missing", judge_cost_usd: 0 }; }
  if (r.must_not_contain) { const bad = r.must_not_contain.filter((s) => answer.toLowerCase().includes(s.toLowerCase())); return { passed: !bad.length, reason: bad.length ? `said ${bad.join(", ")}` : "ok", judge_cost_usd: 0 }; }
  // The judge: the stronger model grades the answer against your rule. Your agent's own
  // eval runner (scripts/run-evals.ts) gets a judge in Chapter 5; until then, judge rules fail there.
  const v = await ask({ prompt: `You grade an AI's answer. Rule: ${r.judge}\n\nTask: ${t.task}\n\nAnswer:\n${answer}\n\nReply with only JSON: {"pass": true or false, "reason": "one sentence"}`, model: "claude-sonnet-5-5", effort: "low" }, false);
  const m = v.answer.match(/\{[\s\S]*\}/);
  let j: { pass?: boolean; reason?: string } = {};
  try { j = m ? JSON.parse(m[0]) : {}; } catch { j = {}; }
  return { passed: Boolean(j.pass), reason: j.reason ?? "no verdict", judge_cost_usd: v.cost_usd };
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true });
  if (cmd === "test") {
    const r = await ask({ prompt: "Say OK", max_tokens: 50, thinking: false, effort: "low" }, false);
    console.log(`${r.answer.trim()} | stop reason: ${r.stop_reason} | ${r.tokens_in} in, ${r.tokens_out} out | $${r.cost_usd}`);
    console.log("The key works. If this failed, the problem is the key or the credit, not your code.");
  } else if (cmd === "ask") {
    const prompt = args.find((a, i) => i > 0 && !a.startsWith("--")) ?? "";
    const r = await ask({ prompt, model: flag("model"), effort: flag("effort") as Effort | undefined, max_tokens: flag("max-tokens") ? Number(flag("max-tokens")) : undefined, thinking: flag("no-thinking") ? false : undefined, stream: Boolean(flag("stream")), system: flag("system") });
    const { answer, ...rest } = r;
    void answer;
    console.log(JSON.stringify(rest));
  } else if (cmd === "try") {
    const experiments: Call[] = JSON.parse(fs.readFileSync(`${DIR}/experiments.json`, "utf8")).calls;
    const rows: Result[] = [];
    for (const [i, e] of experiments.entries()) {
      console.log(`\n--- call ${i + 1}: ${e.prompt}`);
      rows.push(await ask(e));
    }
    const head = ["#", "prompt", "model", "effort", "thinking", "max_tokens", "stop_reason", "tokens_in", "tokens_out", "seconds", "first_word_seconds", "cost_usd"];
    const md = `# Ten calls, one usage table (${today()})\n\nMade by \`npm run model:try\` from stage-01/experiments.json. Each row changes one thing.\n\n${table(head, rows.map((r, i) => [i + 1, experiments[i].prompt, r.model, r.effort, r.thinking, r.max_tokens, r.stop_reason, r.tokens_in, r.tokens_out, r.seconds, r.first_word_seconds, r.cost_usd]))}\n\n## The answers\n\n${rows.map((r, i) => `${i + 1}. ${r.answer.replace(/\n+/g, " ").slice(0, 400)}`).join("\n")}\n`;
    fs.writeFileSync(`${DIR}/usage.md`, md);
    console.log(`\n${table(head, rows.map((r, i) => [i + 1, experiments[i].prompt.slice(0, 30), r.model, r.effort, r.thinking, r.max_tokens, r.stop_reason, r.tokens_in, r.tokens_out, r.seconds, r.first_word_seconds, r.cost_usd]))}`);
    console.log(`\nSaved ${DIR}/usage.md. Look for the max_tokens stop reason: that answer was cut off, even if it looks finished.`);
  } else if (cmd === "suite") {
    const runs = Number(flag("runs") ?? 1);
    const tasks: Task[] = fs.readFileSync("evals/tasks.jsonl", "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
    const results: Record<string, unknown>[] = [];
    for (const model of MODELS) for (const t of tasks) for (let run = 1; run <= runs; run++) {
      const r = await ask({ prompt: t.task, model }, false);
      const g = await check(t, r.answer);
      results.push({ id: t.id, kind: t.kind, model, run, passed: g.passed, reason: g.reason, seconds: r.seconds, cost_usd: r.cost_usd, judge_cost_usd: g.judge_cost_usd, answer: r.answer.replace(/\s+/g, " ").slice(0, 300) });
      console.log(`${g.passed ? "PASS" : "FAIL"} ${model} ${t.id} run ${run} - ${g.reason}`);
    }
    fs.writeFileSync(`${DIR}/probe_runs.csv`, csv(results));
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const r of results) { const k = `${r.model}|${r.kind}`; groups.set(k, [...(groups.get(k) ?? []), r]); }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const byKind = [...groups.entries()].map(([k, rs]) => { const [model, kind] = k.split("|"); return [model, kind, rs.length, `${Math.round(mean(rs.map((r) => (r.passed ? 1 : 0))) * 100)}%`, mean(rs.map((r) => Number(r.cost_usd))).toFixed(5), mean(rs.map((r) => Number(r.seconds))).toFixed(1)]; });
    const lines = MODELS.map((m) => { const rs = results.filter((r) => r.model === m); return `| ${today()} | 1 | bare model, no tools: ${m} | ${tasks.length} | ${Math.round(mean(rs.map((r) => (r.passed ? 1 : 0))) * 100)}% of ${rs.length} runs | $${mean(rs.map((r) => Number(r.cost_usd))).toFixed(5)} | ${mean(rs.map((r) => Number(r.seconds))).toFixed(1)}s |`; });
    const md = `# The bare model on your task suite (${today()})\n\nMade by \`npm run model:suite -- --runs=${runs}\`: every task in evals/tasks.jsonl, ${runs} run(s) each, on ${MODELS.join(" and ")}, with no tools, no search and no memory. Every run is in stage-01/probe_runs.csv.\n\n## Pass rate by model and kind\n\n${table(["model", "kind", "runs", "pass rate", "avg cost $", "avg seconds"], byKind)}\n\n## Lines for SCOREBOARD.md\n\n${lines.join("\n")}\n`;
    fs.writeFileSync(`${DIR}/suite.md`, md);
    console.log(`\nSaved ${DIR}/suite.md and ${DIR}/probe_runs.csv. Copy these lines into SCOREBOARD.md:\n${lines.join("\n")}`);
  } else if (cmd === "calc") {
    const expr = args.slice(1).join(" ");
    if (!/^[\d\s+\-*/().%,e]*$/i.test(expr)) { console.error("Only numbers and + - * / ** ( ) % are allowed."); process.exit(1); }
    const value = Function(`"use strict"; return (${expr.replace(/,/g, "")});`)() as number;
    console.log(`${expr} = ${Math.round(value * 100) / 100}`);
  } else {
    console.log("Commands: test, try, ask, suite, calc. See the top of scripts/meet-the-model.ts.");
  }
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
