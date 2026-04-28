// Drama Remix — stylizes an existing pet photo using Lovable AI image editing.
// Keeps the pet recognizable while applying a mood from the chosen drama style.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageDataUrl, styleId, petType } = await req.json();
    if (!imageDataUrl || !styleId) {
      return new Response(JSON.stringify({ error: "Missing imageDataUrl or styleId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const styleMood = STYLE_PROMPTS[styleId] ?? "stylized cinematic pet portrait, vibrant mood";
    const subject = petType && petType !== "other" ? `the same ${petType}` : "the same pet";

    const prompt = `Restyle this photo of a pet into a stylized portrait. CRITICAL: keep ${subject} clearly recognizable — preserve the exact face, fur color and markings, eye color, breed, ears, and overall cuteness. Do NOT change the species or the individual animal. Only change the lighting, colors, background, and atmosphere to match this mood: ${styleMood}. Keep the pet as the clear focal point, centered, sharp, and adorable. Square 1:1 framing.`;

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable Cloud workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Remix failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const remixedUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!remixedUrl) {
      console.error("No image in AI response", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageDataUrl: remixedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("drama-remix error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
