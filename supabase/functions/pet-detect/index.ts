import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PET_TYPES = new Set(["dog", "cat", "bird", "rabbit", "hamster", "spider", "fish", "reptile", "other"]);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseJsonFromText(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);

  try {
    const { imageDataUrl } = await req.json().catch(() => ({}));
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return json({ ok: false, error: "imageDataUrl required" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ ok: false, error: "ai_unavailable", code: "ai_unavailable" }, 200);

    const prompt = [
      "Classify the uploaded image for a pet-only meme app.",
      "Return ONLY compact JSON with these fields:",
      '{ "isAnimal": boolean, "isHumanOnly": boolean, "petType": "dog|cat|bird|rabbit|hamster|spider|fish|reptile|other", "confidence": number, "reason": string }',
      "Rules:",
      "- If the image is only humans/no animal, set isHumanOnly true and isAnimal false.",
      "- If humans are present but an animal is clearly the subject, classify the animal.",
      "- spider includes tarantulas and insects/spider-like arthropods kept as pets.",
      "- reptile includes lizards, snakes, turtles, geckos and iguanas.",
      "- other is for real animals not listed.",
      "- Never classify plush toys, drawings, food or objects as animals unless a real animal is visible.",
    ].join(" ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("[pet-detect] gateway", response.status, text.slice(0, 400));
      return json({ ok: false, error: "ai_unavailable", code: "ai_unavailable" }, 200);
    }

    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map((part) => part?.text ?? "").join("\n")
      : String(content ?? "");
    const parsed = parseJsonFromText(text);
    if (!parsed) return json({ ok: false, error: "classification_failed" }, 200);

    const petType = PET_TYPES.has(parsed.petType) ? parsed.petType : "other";
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));

    return json({
      ok: true,
      isAnimal: Boolean(parsed.isAnimal),
      isHumanOnly: Boolean(parsed.isHumanOnly),
      petType,
      confidence,
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 160) : "",
    });
  } catch (err) {
    console.error("[pet-detect]", err);
    return json({ ok: false, error: "ai_unavailable", code: "ai_unavailable" }, 200);
  }
});
