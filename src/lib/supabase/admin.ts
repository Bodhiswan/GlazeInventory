import { createClient } from "@supabase/supabase-js";

import { getSupabaseAdminEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

export function createSupabaseAdminClient() {
  const env = getSupabaseAdminEnv();

  if (!env) {
    return null;
  }

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
