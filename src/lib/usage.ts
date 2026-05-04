// Frontend wrapper for the server-side usage gate.
// MUST be called before any AI creation (generate / regenerate / remix).
import { supabase } from "@/integrations/supabase/client";
import { getAnonKey } from "./anon-id";

export type UsageKind = "generate" | "regenerate" | "remix";

export interface UsageCheckResult {
  ok: boolean;
  plan?: "anon" | "free" | "pro";
  remaining?: number;
  plan?: "anon" | "free" | "standard" | "pro" | "admin";
    | "pro_only"
    | "auth_required"
    | "ai_unavailable"
    | "server_error"
    | "bad_kind";
  signupRequired?: boolean;
}

export async function checkUsage(kind: UsageKind): Promise<UsageCheckResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const body = {
      kind,
      anonKey: token ? null : getAnonKey(),
    };
    // Call the edge function with raw fetch so handled limit/unavailable states
    // are always controlled data responses and never thrown exceptions.
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/usage-check`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    let parsed: any = null;
    try { parsed = await res.json(); } catch { /* ignore */ }
    if (parsed && typeof parsed === "object") return parsed as UsageCheckResult;
    return { ok: false, error: "server_error" };
  } catch (e) {
    console.warn("[checkUsage] network error", e);
    return { ok: false, error: "server_error" };
  }
}
