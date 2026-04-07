import { describe, expect, it } from "vitest";

import {
  buildViewerContext,
  createAnonymousViewer,
  evaluateRouteAccess,
  resolveAccessRequirement,
} from "@/lib/auth/access";

const companyA = {
  city: "Abu Dhabi",
  countryCode: "AE",
  createdAt: "2026-04-01T00:00:00.000Z",
  description: "Energy operator",
  headquartersLabel: "Abu Dhabi, UAE",
  id: "company-a",
  isPublic: true,
  logoPath: null,
  name: "ADNOC Group",
  slug: "adnoc-group",
  updatedAt: "2026-04-01T00:00:00.000Z",
  websiteUrl: "https://adnoc.example",
} as const;

const companyB = {
  city: "Masdar City",
  countryCode: "AE",
  createdAt: "2026-04-01T00:00:00.000Z",
  description: "Energy innovation company",
  headquartersLabel: "Masdar City, UAE",
  id: "company-b",
  isPublic: true,
  logoPath: null,
  name: "Masdar",
  slug: "masdar",
  updatedAt: "2026-04-01T00:00:00.000Z",
  websiteUrl: "https://masdar.example",
} as const;

describe("auth access", () => {
  it("maps planned routes to public, authenticated, verified-member, and admin access", () => {
    expect(resolveAccessRequirement("/analytics")).toBe("public");
    expect(resolveAccessRequirement("/account")).toBe("authenticated");
    expect(resolveAccessRequirement("/submit")).toBe("verified_member");
    expect(resolveAccessRequirement("/drafts/draft-123")).toBe("verified_member");
    expect(resolveAccessRequirement("/admin/links")).toBe("admin");
    expect(resolveAccessRequirement("/unknown")).toBeNull();
  });

  it("derives viewer identity, company context, and elevated access from profile and memberships", () => {
    const viewer = buildViewerContext({
      authConfigured: true,
      authUser: {
        email: "aliahassan@nasq.ae",
        id: "user-1",
        userMetadata: {},
      },
      companies: [companyA, companyB],
      memberships: [
        {
          companyId: companyA.id,
          createdAt: "2026-04-02T00:00:00.000Z",
          id: "membership-1",
          isPrimary: false,
          role: "member",
          suspendedAt: null,
          updatedAt: "2026-04-02T00:00:00.000Z",
          userId: "user-1",
          verificationStatus: "pending",
          verifiedAt: null,
        },
        {
          companyId: companyB.id,
          createdAt: "2026-04-03T00:00:00.000Z",
          id: "membership-2",
          isPrimary: true,
          role: "company_admin",
          suspendedAt: null,
          updatedAt: "2026-04-03T00:00:00.000Z",
          userId: "user-1",
          verificationStatus: "verified",
          verifiedAt: "2026-04-04T00:00:00.000Z",
        },
      ],
      profile: {
        avatarUrl: null,
        createdAt: "2026-04-01T00:00:00.000Z",
        displayName: "Alia Hassan",
        email: "aliahassan@nasq.ae",
        firstName: "Alia",
        id: "user-1",
        lastName: "Hassan",
        locale: "en-AE",
        platformRole: "admin",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    });

    expect(viewer.status).toBe("authenticated");
    expect(viewer.displayName).toBe("Alia Hassan");
    expect(viewer.initials).toBe("AH");
    expect(viewer.isAdmin).toBe(true);
    expect(viewer.isVerifiedMember).toBe(true);
    expect(viewer.primaryCompany?.name).toBe("Masdar");
    expect(viewer.memberships).toHaveLength(2);
  });

  it("falls back cleanly to an anonymous viewer when there is no signed-in user", () => {
    const viewer = createAnonymousViewer({ authConfigured: false });

    expect(viewer.status).toBe("anonymous");
    expect(viewer.displayName).toBe("Guest");
    expect(viewer.initials).toBe("GU");
    expect(viewer.primaryCompany).toBeNull();
    expect(viewer.isVerifiedMember).toBe(false);
  });

  it("enforces account, verified-member, and admin route decisions with stable redirects", () => {
    const anonymousViewer = createAnonymousViewer({ authConfigured: true });

    const pendingViewer = buildViewerContext({
      authConfigured: true,
      authUser: {
        email: "pending@nasq.ae",
        id: "user-2",
        userMetadata: {},
      },
      companies: [companyA],
      memberships: [
        {
          companyId: companyA.id,
          createdAt: "2026-04-02T00:00:00.000Z",
          id: "membership-3",
          isPrimary: true,
          role: "member",
          suspendedAt: null,
          updatedAt: "2026-04-02T00:00:00.000Z",
          userId: "user-2",
          verificationStatus: "pending",
          verifiedAt: null,
        },
      ],
      profile: {
        avatarUrl: null,
        createdAt: "2026-04-01T00:00:00.000Z",
        displayName: "Pending User",
        email: "pending@nasq.ae",
        firstName: "Pending",
        id: "user-2",
        lastName: "User",
        locale: "en-AE",
        platformRole: "member",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    });

    const verifiedViewer = buildViewerContext({
      authConfigured: true,
      authUser: {
        email: "verified@nasq.ae",
        id: "user-3",
        userMetadata: {},
      },
      companies: [companyA],
      memberships: [
        {
          companyId: companyA.id,
          createdAt: "2026-04-02T00:00:00.000Z",
          id: "membership-4",
          isPrimary: true,
          role: "member",
          suspendedAt: null,
          updatedAt: "2026-04-02T00:00:00.000Z",
          userId: "user-3",
          verificationStatus: "verified",
          verifiedAt: "2026-04-03T00:00:00.000Z",
        },
      ],
      profile: {
        avatarUrl: null,
        createdAt: "2026-04-01T00:00:00.000Z",
        displayName: "Verified User",
        email: "verified@nasq.ae",
        firstName: "Verified",
        id: "user-3",
        lastName: "User",
        locale: "en-AE",
        platformRole: "member",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    });

    const adminViewer = buildViewerContext({
      authConfigured: true,
      authUser: {
        email: "admin@nasq.ae",
        id: "user-4",
        userMetadata: {},
      },
      companies: [companyA],
      memberships: [],
      profile: {
        avatarUrl: null,
        createdAt: "2026-04-01T00:00:00.000Z",
        displayName: "Admin User",
        email: "admin@nasq.ae",
        firstName: "Admin",
        id: "user-4",
        lastName: "User",
        locale: "en-AE",
        platformRole: "admin",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
    });

    expect(evaluateRouteAccess(anonymousViewer, "/account")).toMatchObject({
      allowed: false,
      redirectTo: "/auth?mode=signin&next=%2Faccount",
      requirement: "authenticated",
    });
    expect(evaluateRouteAccess(anonymousViewer, "/submit")).toMatchObject({
      allowed: false,
      redirectTo: "/auth?mode=signin&next=%2Fsubmit",
      requirement: "verified_member",
    });
    expect(evaluateRouteAccess(pendingViewer, "/account")).toMatchObject({
      allowed: true,
      requirement: "authenticated",
    });
    expect(evaluateRouteAccess(pendingViewer, "/submit")).toMatchObject({
      allowed: false,
      redirectTo: "/account",
      requirement: "verified_member",
    });
    expect(evaluateRouteAccess(verifiedViewer, "/submit")).toMatchObject({
      allowed: true,
      requirement: "verified_member",
    });
    expect(evaluateRouteAccess(verifiedViewer, "/admin/links")).toMatchObject({
      allowed: false,
      redirectTo: "/account",
      requirement: "admin",
    });
    expect(evaluateRouteAccess(adminViewer, "/admin/links")).toMatchObject({
      allowed: true,
      requirement: "admin",
    });
  });
});
