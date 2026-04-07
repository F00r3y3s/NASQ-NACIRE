import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { assertSupabasePublicEnvironment } from "@/config/env";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = assertSupabasePublicEnvironment();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may expose a read-only cookie store. The proxy
          // keeps the browser session fresh for those cases.
        }
      },
    },
  });
}
