import { describe, expect, it } from "vitest";

describe("next config security headers", () => {
  it("adds the baseline release security headers to all routes", async () => {
    // @ts-expect-error Next config is an ESM runtime module without generated test typings.
    const { default: nextConfig } = await import("../../next.config.mjs");
    const rules = await nextConfig.headers?.();

    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          headers: expect.arrayContaining([
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin",
            },
            {
              key: "Permissions-Policy",
              value:
                "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
            },
          ]),
          source: "/(.*)",
        }),
      ]),
    );
  });
});
