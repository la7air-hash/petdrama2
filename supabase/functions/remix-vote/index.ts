// Public, unauthenticated. Records one remix vote per shared card + browser key.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizeVoterKey = (value: unknown) => {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, 160);
  return v.length >= 8 ? v : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    const variantKey = typeof body?.variantKey === "string" ? body.variantKey.trim() : "";
    const voterKey = normalizeVoterKey(body?.voterKey);

    if (!slug || !variantKey || !voterKey) {
      return json({ error: "slug, variantKey and voterKey required" }, 400);
    }
    if (variantKey !== "original" && !variantKey.startsWith("remix:")) {
      return json({ error: "Unsupported variant" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: item, error: itemError } = await supabase
      .from("gallery_items")
      .select("id")
      .eq("public_share_slug", slug)
      .eq("share_enabled", true)
      .maybeSingle();

    if (itemError) throw itemError;
    if (!item) return json({ error: "Not found" }, 404);

    if (variantKey.startsWith("remix:")) {
      const remixId = variantKey.slice("remix:".length);
      const { data: remix, error: remixError } = await supabase
        .from("gallery_remixes")
        .select("id")
        .eq("id", remixId)
        .eq("gallery_item_id", item.id)
        .maybeSingle();

      if (remixError) throw remixError;
      if (!remix) return json({ error: "Remix not found" }, 404);
    }

    const { error: upsertError } = await supabase
      .from("remix_votes")
      .upsert(
        {
          gallery_item_id: item.id,
          variant_key: variantKey,
          voter_key: voterKey,
        },
        { onConflict: "gallery_item_id,voter_key" },
      );

    if (upsertError) throw upsertError;

    const { data: votes, error: votesError } = await supabase
      .from("remix_votes")
      .select("variant_key")
      .eq("gallery_item_id", item.id);

    if (votesError) throw votesError;

    const counts: Record<string, number> = {};
    for (const vote of votes ?? []) {
      counts[vote.variant_key] = (counts[vote.variant_key] ?? 0) + 1;
    }

    return json({
      ok: true,
      selected: variantKey,
      counts,
      total: votes?.length ?? 0,
    });
  } catch (err) {
    console.error("[remix-vote]", err);
    return json({ error: (err as Error).message }, 500);
  }
});
