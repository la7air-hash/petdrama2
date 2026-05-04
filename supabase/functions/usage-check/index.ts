// usage-check — server-side gatekeeper for AI creations.
// Called BEFORE generate / regenerate / remix. Atomically records the event
// and enforces per-tier limits. Frontend cannot be trusted; this is the
// single source of truth.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kind, anonKey } = await req.json();
    if (!["generate", "regenerate", "remix"].includes(kind)) {
      return json({ ok: false, error: "bad_kind" }, 400);
    }

    // Resolve user from JWT if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice("Bearer ".length);
      const userClient = createClient(SUPABASE_URL, ANON_KEY);
      const { data, error } = await userClient.auth.getUser(token);
      if (!error && data?.user) userId = data.user.id;
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data, error } = await admin.rpc("consume_usage", {
      _user_id: userId,
      _anon_key: userId ? null : (typeof anonKey === "string" ? anonKey : null),
      _kind: kind,
    });

    if (error) {
      console.error("consume_usage error:", error);
      return json({ ok: false, error: "server_error" }, 500);
    }

    const result = data as Record<string, unknown>;
    if (!result?.ok) {
      const code = result?.error;
      const status = code === "pro_only" ? 403
                   : code === "anon_limit" ? 402
                   : code === "daily_limit_reached" ? 402
                   : code === "monthly_limit_reached" ? 402
                   : 400;
      return json(result, status);
    }
    return json(result, 200);
  } catch (e) {
    console.error("usage-check unexpected:", e);
    return json({ ok: false, error: "server_error" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
