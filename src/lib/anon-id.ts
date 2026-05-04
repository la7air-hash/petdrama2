// Stable anonymous device id used to enforce the 1-creation cap for
// non-logged-in visitors. Imperfect (clearable), but server-recorded.
const KEY = "pd_anon_id";

export function getAnonKey(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      v = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return `eph-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
