"""Writes the Chapter 2 practice traces: users.csv, runs.csv, steps.csv.

The data is made up but shaped like a real general-purpose agent's logs, with
patterns worth finding. Run it again and you get exactly the same files (fixed seed).
    python3 data/practice-traces/make_traces.py
"""
import csv, random, datetime as dt, os

random.seed(42)
OUT = os.path.dirname(os.path.abspath(__file__))
START = dt.datetime(2026, 10, 1)
DAYS = 55

SEGMENTS = [("student", 0.40), ("pm", 0.30), ("founder", 0.15), ("analyst", 0.15)]
COUNTRIES = ["IN", "IN", "IN", "US", "US", "UK", "DE", "SG"]

def pick(weighted):
    r, acc = random.random(), 0
    for v, w in weighted:
        acc += w
        if r <= acc:
            return v
    return weighted[-1][0]

users = []
for i in range(1, 401):
    signup = START - dt.timedelta(days=60) + dt.timedelta(days=random.randint(0, 105))
    users.append({"id": f"u{i:04d}", "segment": pick(SEGMENTS), "country": random.choice(COUNTRIES), "signup_date": signup.date().isoformat()})
seg = {u["id"]: u["segment"] for u in users}

TASKS = {
    "look up a fact": ["What is the latest version of {x}?", "When did {x} last change its pricing?", "Who is the CEO of {x}?", "What does {x} cost per month for a team of 5?"],
    "compare and decide": ["Compare {x} and {y} for a small team and recommend one.", "Should we use {x} or {y} for product analytics?", "Which is cheaper for 10 users, {x} or {y}?"],
    "calculate": ["We have {n} users at ${p} a month and lose {c}% a month. Revenue after 6 months?", "What is {c}% of {n}?", "If {n} trials convert at {c}%, how many paying users?"],
    "multi-step research": ["Summarise what changed in {x} this year and why it matters.", "Find three case studies of companies using {x} and what they learned.", "What are people saying about {x} versus {y}?"],
    "refuse or ask": ["Make the report for my team.", "Book a meeting with {x}'s sales team for me.", "Delete all my old files.", "Write the thing we discussed."],
}
NAMES = ["Notion", "Linear", "Jira", "Amplitude", "Mixpanel", "Figma", "Slack", "Airtable", "Zapier", "Posthog", "Next.js", "Supabase"]
PII = ["My email is {e}, send it there.", "Call me on {ph} if unclear.", "Use my work account {e}."]
KINDS = [("look up a fact", 0.25), ("compare and decide", 0.20), ("calculate", 0.15), ("multi-step research", 0.25), ("refuse or ask", 0.15)]
PRICE = {"claude-haiku-5-5": (0.10, 0.50), "claude-sonnet-5-5": (2.0, 10.0)}
OUTAGE = (dt.datetime(2026, 11, 10), dt.datetime(2026, 11, 15))  # the search provider had trouble

def task_text(kind):
    t = random.choice(TASKS[kind])
    a, b = random.sample(NAMES, 2)
    t = t.format(x=a, y=b, n=random.choice([840, 1240, 3200, 15000]), p=random.choice([9, 12, 29]), c=random.choice([2.5, 3.5, 7, 12]))
    if random.random() < 0.04:
        t += " " + random.choice(PII).format(e=f"{random.choice(['asha', 'raj', 'mei', 'tom'])}.{random.randint(10, 99)}@example.com", ph=f"+1 555-01{random.randint(10000000, 99999999) % 100:02d}")  # 555-01xx is reserved for fiction: never a real number
    return t

runs, steps = [], []

def add_run(rid, user, when, kind, model, source, status, plan):
    """plan: list of (kind, name, is_error, error_text)."""
    total_ms, total_cost = 0, 0.0
    for idx, (k, name, err, etext) in enumerate(plan):
        if k == "model":
            tin = random.randint(2500, 9000) + idx * random.randint(1500, 4000)  # each step re-reads everything so far
            tout = random.randint(80, 900)
            ms = random.randint(900, 4800)
            pin, pout = PRICE[model]
            cost = (tin * pin + tout * pout) / 1e6
        else:
            tin = tout = 0
            ms = {"web_search": random.randint(400, 1500), "read_page": random.randint(900, 6500), "run_python": random.randint(1800, 4200), "search_my_docs": random.randint(300, 900)}.get(name, 500)
            if err:
                ms = random.randint(8000, 15000) if name == "web_search" else ms
            cost = 0.0
        total_ms += ms
        total_cost += cost
        steps.append({"run_id": rid, "idx": idx, "kind": k, "name": name, "ms": ms, "input_tokens": tin, "output_tokens": tout, "cost_usd": round(cost, 6), "is_error": str(bool(err)).lower(), "error_text": etext})
    runs.append({"id": rid, "user_id": user, "created_at": when.isoformat(timespec="seconds"), "task_kind": kind, "task": task_text(kind), "model": model, "source": source, "status": status,
                 "steps_used": sum(1 for p in plan if p[0] == "model"), "cost_usd": round(total_cost, 6), "duration_ms": total_ms})

M = ("model", "", False, "")
def tool(name, err=False, etext=""): return ("tool", name, err, etext)

for i in range(1, 2001):
    rid = f"r{i:05d}"
    user = random.choice(users)["id"]
    when = START + dt.timedelta(days=random.random() * DAYS)
    kind = pick(KINDS)
    model = "claude-haiku-5-5" if random.random() < 0.8 else "claude-sonnet-5-5"
    status = "done"
    if kind == "look up a fact":
        if OUTAGE[0] <= when < OUTAGE[1] and random.random() < 0.7:
            plan, status = [M, tool("web_search", True, "Search timed out after 15s"), M, tool("web_search", True, "Search timed out after 15s"), M], "failed"
        else:
            plan = [M, tool("web_search"), M, tool("read_page"), M]
            if random.random() < 0.06:
                plan, status = [M, tool("web_search"), M], "partial"  # answered from snippets only
    elif kind == "compare and decide":
        plan = [M, tool("web_search"), tool("web_search"), M, tool("read_page"), tool("read_page"), M, tool("run_python"), M]
        if random.random() < 0.08:
            status = "partial"  # one option's pricing page could not be read
            plan[4] = tool("read_page", True, "The page had almost no readable text (it may need JavaScript).")
    elif kind == "calculate":
        if model == "claude-haiku-5-5" and random.random() < 0.18:
            plan, status = [M], "failed"  # did the maths in its head; wrong number
        else:
            plan = [M, tool("run_python"), M]
    elif kind == "multi-step research":
        n = random.randint(3, 6)
        plan = [M] + sum([[tool("web_search"), M, tool("read_page"), M] for _ in range(n)], [])
        if n >= 5 and random.random() < 0.5:
            plan, status = plan[:15], "partial"  # hit the step limit
    else:  # refuse or ask
        plan = [M]
        if seg[user] == "student" and random.random() < 0.12:
            status = "failed"  # refused something it should have helped with
    add_run(rid, user, when, kind, model, "app", status, plan)

# The test user's eval runs, mixed into the same log: all easy, all passing.
for j in range(1, 301):
    when = START + dt.timedelta(days=random.random() * DAYS)
    kind = pick(KINDS)
    add_run(f"e{j:05d}", "u-eval-bot", when, kind, "claude-haiku-5-5", "eval", "done", [M, tool("web_search"), M] if kind != "refuse or ask" else [M])

runs.sort(key=lambda r: r["created_at"])
for name, rows in (("users", users), ("runs", runs), ("steps", steps)):
    with open(os.path.join(OUT, f"{name}.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(name, len(rows))
