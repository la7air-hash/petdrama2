// Tracks the active draft "owner" (user_id or 'anon') so per-user drafts
// stay isolated in localStorage. Emits a window event when the owner changes
// so /create can reset its in-memory state.
import { supabase } from "@/integrations/supabase/client";

const OWNER_KEY = "petdrama:owner";
export const OWNER_CHANGED_EVENT = "petdrama:owner-changed";

let currentOwner: string = "anon";

export function getOwnerId(): string {
  return currentOwner;
}

export function ownerKeySuffix(owner: string = currentOwner): string {
  return owner === "anon" ? "anon" : owner;
}

function readPersistedOwner(): string {
  try {
    return localStorage.getItem(OWNER_KEY) || "anon";
  } catch {
    return "anon";
  }
}

function writePersistedOwner(owner: string) {
  try {
    localStorage.setItem(OWNER_KEY, owner);
  } catch {
    /* noop */
  }
}

function setOwner(next: string) {
  const prev = currentOwner;
  currentOwner = next;
  if (prev !== next) {
    writePersistedOwner(next);
    try {
      window.dispatchEvent(new CustomEvent(OWNER_CHANGED_EVENT, { detail: { prev, next } }));
    } catch {
      /* noop */
    }
  }
}

/** Wipes the active draft for a specific owner. Does NOT touch other owners' data. */
export function clearActiveDraftForOwner(owner: string) {
  try {
    localStorage.removeItem(`petdrama:current:${ownerKeySuffix(owner)}`);
  } catch {
    /* noop */
  }
}

/** Initialize once at app boot. Sets the current owner and subscribes to auth. */
export function initDraftOwner() {
  // Hydrate from storage so the very first read on /create is correct.
  currentOwner = readPersistedOwner();

  // Then reconcile with the actual session (async).
  supabase.auth.getSession().then(({ data }) => {
    const next = data.session?.user?.id ? `user:${data.session.user.id}` : "anon";
    setOwner(next);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    const next = session?.user?.id ? `user:${session.user.id}` : "anon";
    if (event === "SIGNED_OUT") {
      // Wipe the previous user's active draft so the next person on this
      // browser does not see their photo/inputs.
      clearActiveDraftForOwner(currentOwner);
    }
    setOwner(next);
  });
}
