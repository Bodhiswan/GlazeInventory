"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function ClarityAnalytics({ projectId }: { projectId: string }) {
  useEffect(() => {
    Clarity.init(projectId);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const applyUser = (
      userId: string | null | undefined,
      role: string | null | undefined,
    ) => {
      if (userId) {
        try {
          Clarity.identify(userId);
          Clarity.setTag("authenticated", "true");
          if (role) Clarity.setTag("role", role);
        } catch {
          // no-op: Clarity may not be ready yet
        }
      } else {
        try {
          Clarity.setTag("authenticated", "false");
        } catch {}
      }
    };

    void supabase.auth.getUser().then(({ data }) => {
      applyUser(data.user?.id, (data.user?.app_metadata?.role as string) ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(
        session?.user?.id,
        (session?.user?.app_metadata?.role as string) ?? null,
      );
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [projectId]);

  return null;
}
