import { describe, expect, it } from "vitest";

import { adminRoutes, memberRoutes, publicRoutes } from "@/config/routes";
import {
  primaryNavigation,
  resolvePrimaryNavigation,
  resolveSecondaryNavigation,
  resolveShellDefinition,
  routeSkeletons,
} from "@/config/shell";

describe("shell config", () => {
  it("defines the six primary artifact nav items in the expected order", () => {
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Dashboard",
      "Browse Challenges",
      "Submit Challenge",
      "Solutions",
      "AI Assistant",
      "Analytics",
    ]);
  });

  it("covers every planned route with a shell definition", () => {
    expect(routeSkeletons.map((route) => route.pattern)).toEqual([
      ...publicRoutes,
      ...memberRoutes,
      ...adminRoutes,
    ]);
  });

  it("resolves active primary nav for public, detail, and member workflow pages", () => {
    expect(resolvePrimaryNavigation("/")).toBe("dashboard");
    expect(resolvePrimaryNavigation("/challenges/airspace-safety")).toBe("challenges");
    expect(resolvePrimaryNavigation("/solutions/drone-corridor-kit")).toBe("solutions");
    expect(resolvePrimaryNavigation("/drafts/draft-123")).toBe("submit");
  });

  it("returns secondary navigation only for account and admin routes", () => {
    expect(resolveSecondaryNavigation("/account/challenges")?.map((item) => item.label)).toEqual([
      "Account Overview",
      "My Challenges",
      "My Solutions",
    ]);
    expect(resolveSecondaryNavigation("/admin/links")?.map((item) => item.label)).toEqual([
      "Moderation",
      "Sectors",
      "Companies",
      "Links",
    ]);
    expect(resolveSecondaryNavigation("/analytics")).toBeNull();
  });

  it("resolves route-level shell metadata for dynamic detail pages", () => {
    expect(resolveShellDefinition("/challenges/airspace-safety")).toMatchObject({
      eyebrow: "Challenge Detail",
      title: "Challenge Detail",
    });
    expect(resolveShellDefinition("/admin/companies")).toMatchObject({
      eyebrow: "Admin Governance",
      title: "Company Governance",
    });
  });
});
