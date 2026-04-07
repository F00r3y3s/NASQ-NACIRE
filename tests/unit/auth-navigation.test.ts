import { describe, expect, it } from "vitest";

import {
  buildAuthHref,
  buildProtectedAuthRedirect,
  resolvePostAuthPath,
} from "@/lib/auth/navigation";

describe("auth navigation", () => {
  it("builds auth entry links with a safe next path", () => {
    expect(buildAuthHref("/submit")).toBe("/auth?mode=signin&next=%2Fsubmit");
    expect(buildAuthHref("/account/solutions?solution=123", "signup")).toBe(
      "/auth?mode=signup&next=%2Faccount%2Fsolutions%3Fsolution%3D123",
    );
  });

  it("falls back when the requested next path is external or malformed", () => {
    expect(resolvePostAuthPath("https://evil.example", "/account")).toBe("/account");
    expect(resolvePostAuthPath("//evil.example", "/account")).toBe("/account");
    expect(resolvePostAuthPath("submit", "/account")).toBe("/account");
    expect(resolvePostAuthPath("", "/account")).toBe("/account");
  });

  it("preserves safe internal routes and query strings", () => {
    expect(resolvePostAuthPath("/submit", "/account")).toBe("/submit");
    expect(resolvePostAuthPath("/account/challenges?thread=relay-1", "/account")).toBe(
      "/account/challenges?thread=relay-1",
    );
  });

  it("creates the guest redirect target used by protected routes", () => {
    expect(buildProtectedAuthRedirect("/submit")).toBe("/auth?mode=signin&next=%2Fsubmit");
    expect(buildProtectedAuthRedirect("/admin/moderation")).toBe(
      "/auth?mode=signin&next=%2Fadmin%2Fmoderation",
    );
  });
});
