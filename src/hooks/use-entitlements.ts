import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UsageSummary {
  plan: "anon" | "free" | "pro";
  used_today: number;
  used_month: number;
  daily_limit: number;
  monthly_limit: number;
  remix_allowed: boolean;
}

export interface Entitlements {
  loading: boolean;
  isAnon: boolean;
  isPro: boolean;
  plan: "anon" | "free" | "pro";
  usage: UsageSummary | null;
  refresh: () => Promise<void>;
}

const ANON_USAGE: UsageSummary = {
  plan: "anon",
  used_today: 0,
  used_month: 0,
  daily_limit: 1,
  monthly_limit: 1,
  remix_allowed: false,
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
      setUsage({ ...ANON_USAGE, plan: "free", daily_limit: 5, monthly_limit: 0 });
    } else {
      setUsage(data[0] as UsageSummary);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => { refresh(); });
    refresh();
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const plan = usage?.plan ?? (hasSession ? "free" : "anon");
  return {
    loading,
    isAnon: plan === "anon",
    isPro: plan === "pro",
    plan,
    usage,
    refresh,
  };
}
