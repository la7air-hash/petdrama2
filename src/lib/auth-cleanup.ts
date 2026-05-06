// Full sign-out helper. Wipes only PetDrama-namespaced keys for the current
// user — never touches other users' cached data and never wipes the whole
// browser storage. Call this in place of supabase.auth.signOut() directly.
import { supabase } from "@/integrations/supabase/client";
import { getOwnerId, ownerKeySuffix } from "./draft-owner";

/** localStorage keys that are scoped to a specific user. */
function userScopedKeys(owner: string): string[] {
  const suffix = ownerKeySuffix(owner);
  return [
    `petdrama:current:${suffix}`,
    `petdrama:gallery:${suffix}`,
  ];
}

/** Cross-session helpers (small, navigation-only). */
const SESSION_KEYS = ["petdrama:postLogin", "petdrama:lastRoute"];

export async function signOutAndClear(): Promise<{ ok: boolean; error?: string }> {
  const owner = getOwnerId();

  // 1. Sign out of Supabase first so RLS protects everything else.
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };

  // 2. Wipe only PetDrama keys for the user that just signed out.
  try {
    for (const k of userScopedKeys(owner)) localStorage.removeItem(k);
    // Reset the owner pointer so the next visitor starts as anon.
    localStorage.removeItem("petdrama:owner");
  } catch { /* noop */ }

  try {
    for (const k of SESSION_KEYS) sessionStorage.removeItem(k);
  } catch { /* noop */ }

  return { ok: true };
}
