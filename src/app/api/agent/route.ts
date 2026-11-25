import { userFromRequest } from "@/lib/db";

// ===========================================================================
// YOUR AGENT LIVES HERE.
// Right now this route only proves the plumbing works: it checks who is calling
// and streams one message back to the screen, the same way your agent will.
//
// Chapter 3 is where you brief your AI coding tool to replace this with the loop:
//   call the model -> run any tool it asks for -> give it the result -> repeat,
//   until it answers or hits a step limit. Save every step to the database.
//
// The screen (src/app/page.tsx) already understands these events:
//   { type: "text_delta", text }   a piece of the answer, as it streams in
//   { type: "error", message }     something went wrong
//   { type: "done" }               the run is over
// Add your own event types as your agent grows (tool calls, a plan, approvals).
// ===========================================================================

export const maxDuration = 300;

export async function POST(req: Request) {
  const userId = await userFromRequest(req);
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });
  const { task } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      void task; // the placeholder never repeats the task, so an empty agent fails every eval
      const reply = "Your agent is not built yet. In Chapter 3 you will replace src/app/api/agent/route.ts with a loop that calls the model and its tools.";
      for (const word of reply.split(" ")) {
        send({ type: "text_delta", text: word + " " });
        await new Promise((r) => setTimeout(r, 25));
      }
      send({ type: "done" });
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform" } });
}
