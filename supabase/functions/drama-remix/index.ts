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

// PetDrama brand mood (per logo): warm cream / soft yellow base, with turquoise,
// coral and yellow accents. Soft 3D cartoon / glossy toy-like lighting.
// Family-safe, adorable, never dark or aggressive, never dominant violet/purple.
const BRAND_BASE =
  "soft 3D cartoon-illustration feel with glossy toy-like lighting, warm cream and soft pale-yellow background atmosphere, subtle turquoise / coral / yellow / cream color accents only, family-safe and adorable, no dark or aggressive mood, no dominant violet or purple background, premium editorial pet-portrait quality";

const STYLE_PROMPTS: Record<string, string> = {
  "drama-queen":
    "playful glamour pet star vibe, soft warm coral and yellow stage glow, gentle pink-cream backdrop with sparkle bokeh, cute fashion-cover energy",
  "mafia-boss":
    "cute cartoon mini-boss vibe, warm cream and soft amber tones, very gentle pinstripe pattern hint behind, tiny bow-tie energy, friendly powerful look (never scary)",
  "royal-pet":
    "adorable storybook royal portrait, soft cream and pale-yellow background with light gold accents, tiny crown sparkle, painterly storybook feel, noble but cute",
  "tiny-villain":
    "mischievous cartoon mini-genius vibe, soft cream background with playful turquoise and coral accents, tiny lightning sparkles, NO purple or acid green dominance, cute and giggly mood",
  "jealous-pet":
    "soft pastel telenovela mood, warm cream backdrop with subtle teal and coral accents, gentle side-eye expression, cute and dramatic but never dark",
  "depressed-philosopher":
    "soft contemplative storybook mood, warm cream background with pale yellow window light, tiny book or glasses hint, gentle melancholic but cozy and cute",
  "luxury-pet":
    "ultra cute premium editorial pet portrait, soft champagne, cream and gold tones with subtle marble suggestion, glossy spa-magazine quality, adorable and pampered",
  "hungry-monster":
    "playful warm kitchen vibe, soft cream and golden butter tones, cute crumbs / treats bokeh, big adorable hungry eyes, family-safe goofy mood",
  "office-manager":
    "cute mini office-manager vibe, soft cream background with pale teal and yellow accents, tiny notebook or pen hint, polished but adorable",
  "venetian-noble":
    "soft storybook carnival vibe, warm cream and pale gold tones with gentle damask hint, tiny mask or feather accent, painterly cute old-world feel",
};

// Pet-specific cute toy decorations to integrate naturally into the AI scene.
// These are SUBTLE accents around or near the pet — never covering the pet.
const PET_TOYS: Partial<Record<string, string>> = {
  dog:
    "subtle cute toy-like accents nearby (small soft ball, tiny bone, rope toy, or squeaky toy) — small, integrated naturally, never covering the dog",
  cat:
    "subtle cute toy-like accents nearby (yarn ball, small fish toy, or feather toy) — small, integrated naturally, never covering the cat",
  bird:
    "subtle cute toy-like accents nearby (tiny bell, small swing, seed toy, or perch toy) — small, integrated naturally, never covering the bird",
  hamster:
    "subtle cute toy-like accents nearby (mini exercise wheel, small tunnel, tiny chew toy, or seed accents) — small, integrated naturally, never covering the hamster",
  rabbit:
    "subtle cute toy-like accents nearby (small carrot, tiny ball, or chew toy) — small, integrated naturally, never covering the rabbit",
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
    const { imageDataUrl, styleId, petType, petName, regenerateText } = await req.json();

    console.log("drama-remix request:", {
      hasImage: !!imageDataUrl,
      imageLen: typeof imageDataUrl === "string" ? imageDataUrl.length : 0,
      styleId,
      petType,
      regenerateText: !!regenerateText,
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


    const styleMood = STYLE_PROMPTS[styleId] ?? "cute playful pet portrait, soft cream and yellow vibe";
    const speciesWord = petType && petType !== "other" ? petType : "pet";
    const subject = `the same ${speciesWord}`;
    const toys = (petType && PET_TOYS[petType]) ?? "";

    const prompt = [
      `Restyle this photo of a pet into a polished, premium PetDrama-style portrait.`,
      `CRITICAL IDENTITY: keep ${subject} clearly recognizable — preserve the EXACT same face, fur color and markings, eye color, breed/species, ears, body shape, and overall cuteness. Do NOT change the species or the individual animal. Do NOT add or remove fur color, do not change eye color.`,
      `Style mood: ${styleMood}.`,
      `Overall art direction: ${BRAND_BASE}.`,
      toys ? `Decorations: ${toys}. Keep them small and decorative; the pet must remain the clear focal point.` : `Keep decorations minimal and cute.`,
      `Composition: pet centered, sharp, adorable, square 1:1 framing, clean background that reads well as a social-media card.`,
      `Avoid: dark/aggressive mood, dominant violet/purple background, scary elements, text/letters/logos in the image, watermarks, distorted anatomy.`,
      `Return the image only.`,
    ].join(" ");

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

        // Optional text regeneration — opt-in via `regenerateText: true`.
        // Frontend is NOT activating this yet; structured here for a future toggle.
        // Failures are non-fatal: we still return the image.
        let freshText: { quote?: string; caption?: string; hashtags?: string[] } | undefined;
        if (regenerateText === true) {
          try {
            freshText = await generateRemixText({
              apiKey: LOVABLE_API_KEY,
              petName: typeof petName === "string" ? petName : "the pet",
              petType: speciesWord,
              styleId,
              styleMood,
            });
          } catch (err) {
            console.warn("remix text regen failed (non-fatal):", err);
          }
        }

        return new Response(JSON.stringify({ imageDataUrl: imageUrl, ...(freshText ? { text: freshText } : {}) }), {
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

// ----- Optional: regenerate fresh quote/caption/hashtags for a remix style -----
// Currently OFF by default. Edge function only runs this when the client passes
// `regenerateText: true`. Safe failure: any error is swallowed and the existing
// quote/caption (passed through by the client) remains in use.
async function generateRemixText(args: {
  apiKey: string;
  petName: string;
  petType: string;
  styleId: string;
  styleMood: string;
}): Promise<{ quote: string; caption: string; hashtags: string[] }> {
  const sys =
    "You write short, witty, family-safe captions for a cute pet meme card called PetDrama. " +
    "Always return concise, playful, dramatic-but-cute lines from the pet's POV. No emojis in the quote. No profanity. No real human names.";
  const user =
    `Pet name: ${args.petName}. Species: ${args.petType}. Drama style: ${args.styleId} (${args.styleMood}). ` +
    `Return: quote (max 90 chars, in pet's voice), caption (max 120 chars, third person tease), hashtags (3-5 short, no spaces, no #).`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${args.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [{
        type: "function",
        function: {
          name: "petdrama_text",
          description: "Return remix card text.",
          parameters: {
            type: "object",
            properties: {
              quote: { type: "string" },
              caption: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
            },
            required: ["quote", "caption", "hashtags"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "petdrama_text" } },
    }),
  });
  if (!res.ok) throw new Error(`text-gen HTTP ${res.status}`);
  const data = await res.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  const argsStr = call?.function?.arguments;
  if (!argsStr) throw new Error("text-gen missing tool_calls");
  const parsed = JSON.parse(argsStr);
  return {
    quote: String(parsed.quote ?? "").slice(0, 200),
    caption: String(parsed.caption ?? "").slice(0, 240),
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags.map((s: unknown) => String(s).replace(/^#/, "")).slice(0, 5) : [],
  };
}
