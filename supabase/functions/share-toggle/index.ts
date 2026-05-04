// Owner-only: toggle public sharing for a gallery item, generating a slug on first enable.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function genSlug(len = 10): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => null);
    const itemId = body?.gallery_item_id;
    const enabled = !!body?.enabled;
    if (typeof itemId !== "string" || !itemId) {
      return new Response(JSON.stringify({ error: "gallery_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership + load current slug. RLS already restricts to owner.
    const { data: row, error: loadErr } = await supabase
      .from("gallery_items")
      .select("id, user_id, public_share_slug, share_enabled")
      .eq("id", itemId)
      .maybeSingle();
    if (loadErr) throw loadErr;
    if (!row || row.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let slug: string | null = row.public_share_slug;
    if (enabled && !slug) {
      // Generate unique slug with retry
      for (let i = 0; i < 5; i++) {
        const candidate = genSlug(10);
        const { data: clash } = await supabase
          .from("gallery_items")
          .select("id")
          .eq("public_share_slug", candidate)
          .maybeSingle();
        if (!clash) {
          slug = candidate;
          break;
        }
      }
      if (!slug) throw new Error("Could not generate unique slug");
    }

    const update: Record<string, unknown> = { share_enabled: enabled };
    if (enabled) {
      update.public_share_slug = slug;
      update.shared_at = new Date().toISOString();
    }

    const { error: updErr } = await supabase
      .from("gallery_items")
      .update(update)
      .eq("id", itemId);
    if (updErr) throw updErr;

    return new Response(
      JSON.stringify({ slug, share_enabled: enabled, url: slug ? `/p/${slug}` : null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[share-toggle]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
