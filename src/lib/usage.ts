// Frontend wrapper for the server-side usage gate.
// MUST be called before any AI creation (generate / regenerate / remix).
import { supabase } from "@/integrations/supabase/client";
import { getAnonKey } from "./anon-id";

export type UsageKind = "generate" | "regenerate" | "remix";

export interface UsageCheckResult {
  ok: boolean;
  plan?: "anon" | "free" | "pro";
  remaining?: number;
  error?:
    | "anon_limit"
    | "daily_limit_reached"
    | "monthly_limit_reached"
    | "pro_only"
    | "auth_required"
    | "server_error"
    | "bad_kind";
  signupRequired?: boolean;
}

export async function checkUsage(kind: UsageKind): Promise<UsageCheckResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const body = {
    kind,
    anonKey: token ? null : getAnonKey(),
  };
  const { data, error } = await supabase.functions.invoke("usage-check", { body });
  if (error) {
    // Try to extract structured error body
    try {
      const resp = (error as any)?.context?.response;
      const parsed = await resp?.clone?.().json?.();
      if (parsed && typeof parsed === "object") return parsed as UsageCheckResult;
    } catch { /* ignore */ }
    return { ok: false, error: "server_error" };
  }
  return data as UsageCheckResult;
}
