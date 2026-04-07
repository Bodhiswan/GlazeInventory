import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();

  if (!env) {
    return null;
  }

  return createBrowserClient<Database>(env.url, env.anonKey);
}
