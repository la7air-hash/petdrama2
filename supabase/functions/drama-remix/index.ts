// Drama Remix — stylizes an existing pet photo using Lovable AI image editing.
// Keeps the pet recognizable while applying a mood from the chosen drama style.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SB_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handled = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: false, ...body }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const STYLE_PROMPTS: Record<string, string> = {
  "drama-queen":
    "theatrical spotlight, soft pink and magenta cinematic lighting, glamorous editorial portrait mood, subtle sparkle bokeh, fashion magazine cover vibe",
  "mafia-boss":
    "moody cinematic lighting, deep shadows, warm sepia and amber tones, smoky atmosphere, classic 1970s mafia film vibe, powerful boss-like portrait, optional faint pinstripe background",
  "royal-pet":
    "regal renaissance royal portrait, ornate gold-trim background, deep velvet burgundy and emerald tones, painterly oil-painting feel, soft warm window light, noble dignified mood",
  "tiny-villain":
    "mischievous comic-book villain energy, dramatic purple and acid-green lighting, soft cartoon shading, lightning sparks bokeh, playful evil-genius mood",
  "jealous-pet":
    "moody cinematic close-up, cool teal and crimson lighting, suspicious side-eye energy, soft film grain, telenovela drama vibe",
  "depressed-philosopher":
    "moody black-and-white film portrait with subtle warm highlights, soft window light, melancholic contemplative mood, vintage analog grain",
  "luxury-pet":
    "ultra premium editorial portrait, glossy magazine quality, champagne and gold tones, marble and silk background suggestion, luxury skincare ad aesthetic",
  "hungry-monster":
    "playful warm kitchen lighting, golden hour glow, soft food-photography bokeh of crumbs and treats, cute hungry expression mood",
  "office-manager":
    "soft corporate office lighting, beige and navy tones, subtle blurred whiteboard or desk background, polished LinkedIn-style portrait energy",
  "venetian-noble":
    "baroque venetian carnival mood, candlelit warm tones, ornate damask background suggestion, rich burgundy and gold, painterly old-world portrait",
};

// Defensive image extraction — providers return images in various shapes.
function extractImageUrl(data: any): string | null {
  try {
    const choice = data?.choices?.[0];
    const msg = choice?.message;
    if (!msg) return null;

    // 1) Standard Lovable AI Gateway shape: message.images[0].image_url.url
    const imgs = msg.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      const url =
        first?.image_url?.url ||
        first?.url ||
        (typeof first === "string" ? first : null);
      if (url) return url;
    }

    // 2) Some providers return content as array of parts with image_url
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        const url = part?.image_url?.url || part?.image_url;
        if (typeof url === "string" && url.length > 0) return url;
        if (part?.type === "image" && typeof part?.source?.data === "string") {
          const mime = part.source.media_type || "image/png";
          return `data:${mime};base64,${part.source.data}`;
        }
      }
    }

    // 3) Top-level data url field (fallback)
    if (typeof data?.image_url === "string") return data.image_url;
    if (typeof data?.image === "string") return data.image;

    return null;
  } catch {
    return null;
  }
}

function extractEmbeddedError(data: any): { code?: number; message?: string } | null {
  const err = data?.choices?.[0]?.error || data?.error;
  if (!err) return null;
  return { code: err.code, message: err.message };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageDataUrl, styleId, petType } = await req.json();

    console.log("drama-remix request:", {
      hasImage: !!imageDataUrl,
      imageLen: typeof imageDataUrl === "string" ? imageDataUrl.length : 0,
      styleId,
      petType,
    });

    if (!imageDataUrl || !styleId) {
      return new Response(
        JSON.stringify({ error: "Missing imageDataUrl or styleId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Pro guard + usage consumption ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", code: "auth_required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, SB_ANON);
    const { data: userData } = await userClient.auth.getUser(authHeader.slice("Bearer ".length));
    const userId = userData?.user?.id ?? null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized", code: "auth_required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: consume, error: consumeErr } = await admin.rpc("consume_usage", {
      _user_id: userId, _anon_key: null, _kind: "remix",
    });
    if (consumeErr) {
      console.warn("consume_usage unavailable:", consumeErr);
      return handled({ error: "ai_unavailable", code: "ai_unavailable" });
    }
    const consumeRes = consume as Record<string, unknown>;
    if (!consumeRes?.ok) {
      const code = consumeRes?.error as string;
      return handled({ error: code, code });
    }
    const eventId = consumeRes.event_id as string | undefined;
    const refund = async () => {
      if (eventId) await admin.rpc("refund_usage", { _event_id: eventId });
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.warn("LOVABLE_API_KEY not configured");
      await refund();
      return handled({ error: "ai_unavailable", code: "ai_unavailable" });
    }


    const styleMood = STYLE_PROMPTS[styleId] ?? "stylized cinematic pet portrait, vibrant mood";
    const subject = petType && petType !== "other" ? `the same ${petType}` : "the same pet";

    const prompt = `Restyle this photo of a pet into a stylized portrait. CRITICAL: keep ${subject} clearly recognizable — preserve the exact face, fur color and markings, eye color, breed, ears, and overall cuteness. Do NOT change the species or the individual animal. Only change the lighting, colors, background, and atmosphere to match this mood: ${styleMood}. Keep the pet as the clear focal point, centered, sharp, and adorable. Square 1:1 framing. Return the image.`;

    // Try up to 2 times if no image comes back (provider sometimes returns text only).
    const MAX_ATTEMPTS = 2;
    let lastReason = "Unknown error";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      console.log(`drama-remix attempt ${attempt}/${MAX_ATTEMPTS} (style=${styleId})`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const t = await response.text().catch(() => "");
        console.warn("AI gateway HTTP error:", response.status, t.slice(0, 400));

        if (response.status === 429) {
          await refund();
          return handled({ error: "ai_unavailable", code: "ai_unavailable" });
        }
        if (response.status === 402) {
          await refund();
          return handled({ error: "ai_unavailable", code: "ai_unavailable" });
        }

        lastReason = `HTTP ${response.status}`;
        if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      const data = await response.json().catch(() => null);
      const shape = {
        hasChoices: Array.isArray(data?.choices),
        choiceCount: data?.choices?.length ?? 0,
        hasImages: Array.isArray(data?.choices?.[0]?.message?.images),
        imageCount: data?.choices?.[0]?.message?.images?.length ?? 0,
        contentType: typeof data?.choices?.[0]?.message?.content,
        finishReason: data?.choices?.[0]?.finish_reason,
      };
      console.log("AI response shape:", shape);

      const embedded = extractEmbeddedError(data);
      if (embedded) {
        console.warn("Embedded provider error:", embedded);
        if (embedded.code === 429) {
          await refund();
          return handled({ error: "ai_unavailable", code: "ai_unavailable" });
        }
        lastReason = embedded.message || `provider error ${embedded.code}`;
      }

      const imageUrl = extractImageUrl(data);
      if (imageUrl) {
        console.log("drama-remix success on attempt", attempt);
        return new Response(JSON.stringify({ imageDataUrl: imageUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      lastReason = lastReason || "No image in response";
      console.warn(
        "No image extracted on attempt",
        attempt,
        "reason:",
        lastReason,
        "raw:",
        JSON.stringify(data).slice(0, 400),
      );

      if (attempt < MAX_ATTEMPTS) await new Promise((r) => setTimeout(r, 600));
    }

    // Friendly failure — frontend will toast and keep original card.
    await refund();
    return handled({ error: "ai_unavailable", code: "ai_unavailable", reason: lastReason });
  } catch (e) {
    console.warn("drama-remix unexpected error:", e);
    return handled({ error: "ai_unavailable", code: "ai_unavailable" });
  }
});
