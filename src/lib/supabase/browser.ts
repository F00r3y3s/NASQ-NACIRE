import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  assertSupabasePublicEnvironment,
  type SupabasePublicEnvironment,
} from "@/config/env";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(
  env: SupabasePublicEnvironment,
): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey);
  }

  return browserClient;
}

export function getSupabaseBrowserClient() {
  return createSupabaseBrowserClient(assertSupabasePublicEnvironment());
}

