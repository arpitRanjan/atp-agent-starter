import "server-only"; // the build fails if a browser page ever imports this file (it holds the secret key)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The server's database client. It uses the secret key, so it can write to every table.
// It must never be imported into a page that runs in the browser.
let admin: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false },
    });
  }
  return admin;
}

// Who is calling? The browser sends the signed-in user's token; we ask Supabase who it belongs to.
export async function userFromRequest(req: Request): Promise<string | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data, error } = await db().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
