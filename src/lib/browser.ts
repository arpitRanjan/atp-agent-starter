"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The browser's database client. It uses the publishable key, so row level security
// decides what it can read: only the signed-in person's own rows.
// It is created on first use, so the app still builds before you have added your keys.
let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase keys: copy .env.example to .env.local and fill it in.");
    client = createClient(url, key);
  }
  return client;
}

// Every visitor gets an anonymous account on first visit, so their runs belong to them.
export async function token(): Promise<string> {
  const { data } = await supabase().auth.getSession();
  if (data.session) return data.session.access_token;
  const { data: signed, error } = await supabase().auth.signInAnonymously();
  if (error || !signed.session) throw new Error(error?.message ?? "Could not sign in");
  return signed.session.access_token;
}

// Call the agent and receive its events as they happen.
export async function streamAgent(body: Record<string, unknown>, onEvent: (ev: AgentEventLite) => void) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    onEvent({ type: "error", message: err.error ?? "Request failed" });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      if (part.startsWith("data: ")) onEvent(JSON.parse(part.slice(6)));
    }
  }
}

export async function post(url: string, body: unknown) {
  return fetch(url, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${await token()}` }, body: JSON.stringify(body) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AgentEventLite = { type: string; [k: string]: any };
