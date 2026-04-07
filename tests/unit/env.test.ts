import { describe, expect, it } from "vitest";

import {
  assertSupabasePublicEnvironment,
  resolveEnvironmentStatus,
} from "@/config/env";

describe("resolveEnvironmentStatus", () => {
  it("falls back to localhost when NEXT_PUBLIC_APP_URL is not set", () => {
    const status = resolveEnvironmentStatus({});

    expect(status.appUrl).toBe("http://localhost:3000");
    expect(status.supabase.configured).toBe(false);
    expect(status.issues).toContain(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before enabling Supabase-backed features.",
    );
  });

  it("marks Supabase as ready only when both public keys are present and valid", () => {
    const status = resolveEnvironmentStatus({
      NEXT_PUBLIC_APP_URL: "https://nasq.example",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(status.appUrl).toBe("https://nasq.example");
    expect(status.supabase.configured).toBe(true);
    expect(status.supabase.url).toBe("https://example.supabase.co");
    expect(status.supabase.anonKey).toBe("anon-key");
    expect(status.issues).toHaveLength(0);
  });

  it("reports partial configuration instead of failing during import time", () => {
    const status = resolveEnvironmentStatus({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    });

    expect(status.supabase.configured).toBe(false);
    expect(status.issues).toContain(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before enabling Supabase-backed features.",
    );
  });

  it("throws a clear error when a Supabase client is requested before env is ready", () => {
    expect(() =>
      assertSupabasePublicEnvironment({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow(
      "Missing Supabase public environment. Expected both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  });
});

