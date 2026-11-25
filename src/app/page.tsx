"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { streamAgent, token, type AgentEventLite } from "@/lib/browser";

// ===========================================================================
// THE AGENT SCREEN (starter version)
// A task box, your task as a bubble, and the answer streaming in. That is all.
// Over the course you will add: the agent's steps as they happen, its plan, a
// stop button, approvals, questions, citations, follow-ups (Chapter 7 and on).
// The design tokens (colours, type, spacing) are in src/app/globals.css: use
// only those, so everything you add looks like it belongs.
// ===========================================================================

type Turn = { task: string; answer: string; error?: string; done: boolean };

export default function AgentPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);
  const running = turns.length > 0 && !turns[turns.length - 1].done;

  useEffect(() => {
    token().catch(() => {}); // every visitor gets a private anonymous id, with no login screen
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(200, el.scrollHeight) + "px";
  }, [draft]);

  function update(fn: (t: Turn) => Turn) {
    setTurns((prev) => [...prev.slice(0, -1), fn(prev[prev.length - 1])]);
  }

  function onEvent(ev: AgentEventLite) {
    if (ev.type === "text_delta") update((t) => ({ ...t, answer: t.answer + ev.text }));
    if (ev.type === "error") update((t) => ({ ...t, error: ev.message, done: true }));
    if (ev.type === "done") update((t) => ({ ...t, done: true }));
  }

  async function submit() {
    const task = draft.trim();
    if (!task || running) return;
    setDraft("");
    setTurns((prev) => [...prev, { task, answer: "", done: false }]);
    await streamAgent({ task }, onEvent);
    update((t) => ({ ...t, done: true }));
  }

  return (
    <main className="mx-auto max-w-[760px] px-5 pb-48 pt-14 sm:pt-24">
      {turns.length === 0 && (
        <>
          <h1 className="text-[30px] font-normal leading-[34px] tracking-[-0.8px] sm:text-[46px] sm:leading-[48px] sm:tracking-[-1.6px]">What should the agent do?</h1>
          <p className="mt-4 max-w-[600px] text-muted">Describe a task in plain words. (This is the starter: the agent behind this box is yours to build.)</p>
        </>
      )}

      <div className="mt-8 space-y-10">
        {turns.map((t, i) => (
          <section key={i}>
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg bg-sunken px-4 py-3 text-[15px] leading-6">{t.task}</div>
            </div>
            <div className="answer mt-6 whitespace-pre-wrap">{t.answer}{!t.done && <span className="dot-live text-faint"> ●</span>}</div>
            {t.error && <p className="mt-4 rounded-md bg-rose px-3 py-2 text-[14px] text-rose-ink">{t.error}</p>}
          </section>
        ))}
      </div>

      <div className={turns.length ? "fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-bg via-bg to-transparent pb-5 pt-10" : "mt-8"}>
        <div className={turns.length ? "mx-auto max-w-[760px] px-5" : ""}>
          <div className="rounded-xl border border-line bg-elevated shadow-raised focus-within:border-line-strong">
            <textarea
              ref={box}
              autoFocus
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Describe a task, for example: compare three tools and recommend one"
              className="block w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-6 placeholder:text-faint focus:outline-none focus-visible:outline-none"
            />
            <div className="flex items-center px-2.5 pb-2.5 pt-2">
              <span className="px-2 text-[12px] text-faint">Enter to send</span>
              <button onClick={submit} disabled={!draft.trim() || running} aria-label="Send" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-25">
                <ArrowUp size={17} strokeWidth={2.25} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
