import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Plan = "anon" | "free" | "standard" | "pro" | "admin";

export interface UsageSummary {
  plan: Plan;
  standard_used: number;
  standard_limit: number;
  remix_used: number;
  remix_limit: number;
  is_admin: boolean;
}

export interface Entitlements {
  loading: boolean;
  isAnon: boolean;
  isFree: boolean;
  isStandard: boolean;
  isPro: boolean;
  isAdmin: boolean;
  isPaid: boolean; // standard | pro | admin → no watermark, remix unlocked
  plan: Plan;
  usage: UsageSummary | null;
  watermarkEnabled: boolean;
  remixAllowed: boolean;
  refresh: () => Promise<void>;
}

const ANON_USAGE: UsageSummary = {
  plan: "anon",
  standard_used: 0,
  standard_limit: 1,
  remix_used: 0,
  remix_limit: 0,
  is_admin: false,
};

const FREE_FALLBACK: UsageSummary = {
  plan: "free",
  standard_used: 0,
  standard_limit: 10,
  remix_used: 0,
  remix_limit: 3,
  is_admin: false,
};

export function useEntitlements(): Entitlements {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const refresh = useCallback(async () => {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) {
      setHasSession(false);
      setUsage(ANON_USAGE);
      setLoading(false);
      return;
    }
    setHasSession(true);
    const { data, error } = await supabase.rpc("get_my_usage");
    if (error || !data || data.length === 0) {
      setUsage(FREE_FALLBACK);
    } else {
      setUsage(data[0] as unknown as UsageSummary);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => { refresh(); });
    refresh();
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const plan: Plan = (usage?.plan as Plan) ?? (hasSession ? "free" : "anon");
  const isAdmin = plan === "admin";
  const isPro = plan === "pro";
  const isStandard = plan === "standard";
  const isPaid = isStandard || isPro || isAdmin;
  return {
    loading,
    isAnon: plan === "anon",
    isFree: plan === "free",
    isStandard,
    isPro,
    isAdmin,
    isPaid,
    plan,
    usage,
    watermarkEnabled: !isPaid,
    remixAllowed: plan !== "anon", // free has 5/mo, paid more
    refresh,
  };
}
