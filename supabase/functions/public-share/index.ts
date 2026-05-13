// Public, unauthenticated. Returns safe display fields + signed image URLs for a shared item.
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SIGNED_URL_TTL = 60 * 60 * 24; // 24h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let slug = url.searchParams.get("slug");
    if (!slug && req.method === "POST") {
      const body = await req.json().catch(() => null);
      slug = body?.slug ?? null;
    }
    if (!slug || typeof slug !== "string") {
      return new Response(JSON.stringify({ error: "slug required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to read the public item, remix variants, votes and to mint signed URLs.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("gallery_items")
      .select("id, pet_name, pet_type, style_id, pet_role, quote, caption, hashtags, variant, original_image_path, remix_image_path")
      .eq("public_share_slug", slug)
      .eq("share_enabled", true)
      .maybeSingle();

    if (error) throw error;
    if (!row) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signOne = async (path: string | null) => {
      if (!path) return null;
      const { data: s, error: e } = await supabase.storage
        .from("gallery")
        .createSignedUrl(path, SIGNED_URL_TTL);
      if (e || !s?.signedUrl) return null;
      return s.signedUrl;
    };

    const originalUrl = await signOne(row.original_image_path);
    const remixUrl = await signOne(row.remix_image_path);

    const { data: remixRows, error: remixError } = await supabase
      .from("gallery_remixes")
      .select("id, image_path, quote, caption, hashtags, created_at")
      .eq("gallery_item_id", row.id)
      .order("created_at", { ascending: true });

    if (remixError) throw remixError;

    const remixes = await Promise.all(
      (remixRows ?? []).map(async (remix, index) => ({
        id: remix.id,
        key: `remix:${remix.id}`,
        label: `Remix ${index + 1}`,
        url: await signOne(remix.image_path),
        quote: remix.quote,
        caption: remix.caption,
        hashtags: remix.hashtags ?? [],
      })),
    );

    let voteCounts: Record<string, number> = {};
    let voteTotal = 0;
    const { data: votes, error: voteError } = await supabase
      .from("remix_votes")
      .select("variant_key")
      .eq("gallery_item_id", row.id);

    if (!voteError) {
      for (const vote of votes ?? []) {
        voteCounts[vote.variant_key] = (voteCounts[vote.variant_key] ?? 0) + 1;
      }
      voteTotal = votes?.length ?? 0;
    } else {
      console.warn("[public-share votes]", voteError.message);
    }

    return new Response(
      JSON.stringify({
        galleryItemId: row.id,
        petName: row.pet_name,
        petType: row.pet_type,
        styleId: row.style_id,
        petRole: row.pet_role,
        quote: row.quote,
        caption: row.caption,
        hashtags: row.hashtags ?? [],
        variant: row.variant,
        originalUrl,
        remixUrl,
        remixes,
        voteCounts,
        voteTotal,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[public-share]", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
