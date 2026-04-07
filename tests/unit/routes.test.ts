import { describe, expect, it } from "vitest";

import {
  adminRoutes,
  memberRoutes,
  publicRoutes,
  resolveRouteAccess,
} from "@/config/routes";

describe("route catalog", () => {
  it("captures the planned public surfaces from the ticket breakdown", () => {
    expect(publicRoutes).toEqual([
      "/",
      "/challenges",
      "/challenges/[slug]",
      "/solutions",
      "/solutions/[slug]",
      "/ai",
      "/analytics",
    ]);
  });

  it("captures the protected member and admin surfaces", () => {
    expect(memberRoutes).toEqual([
      "/submit",
      "/drafts/[id]",
      "/account",
      "/account/challenges",
      "/account/solutions",
    ]);
    expect(adminRoutes).toEqual([
      "/admin/moderation",
      "/admin/sectors",
      "/admin/companies",
      "/admin/links",
    ]);
  });

  it("resolves route groups for public and protected paths", () => {
    expect(resolveRouteAccess("/analytics")).toEqual({
      group: "public",
      protected: false,
    });
    expect(resolveRouteAccess("/submit")).toEqual({
      group: "member",
      protected: true,
    });
    expect(resolveRouteAccess("/admin/links")).toEqual({
      group: "admin",
      protected: true,
    });
  });

  it("matches dynamic detail routes without overmatching unknown paths", () => {
    expect(resolveRouteAccess("/challenges/airspace-safety")).toEqual({
      group: "public",
      protected: false,
    });
    expect(resolveRouteAccess("/solutions/drone-corridor-kit")).toEqual({
      group: "public",
      protected: false,
    });
    expect(resolveRouteAccess("/unknown")).toBeNull();
  });
});
