import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNextRedirectMocks, createViewerContext } from "./helpers/server-action-test-utils";
import { initialMembershipOnboardingActionState } from "@/lib/auth/onboarding";

describe("membership onboarding action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("creates a pending company onboarding request and redirects back to account", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const rpc = vi.fn(async () => ({
      data: {
        company_id: "company-1",
        membership_id: "membership-1",
      },
      error: null,
    }));

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("next/navigation", () => ({
      redirect,
      unstable_rethrow: unstableRethrow,
    }));
    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));
    vi.doMock("@/lib/auth/server", () => ({
      getCurrentViewer: vi.fn(async () =>
        createViewerContext({
          isVerifiedMember: false,
          memberships: [],
          primaryCompany: null,
        }),
      ),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => ({
        rpc,
      })),
    }));

    const { submitMembershipOnboardingAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("companyName", "Regional Labs");
    formData.set("companySlug", "");
    formData.set("websiteUrl", "https://regional.example");
    formData.set("headquartersLabel", "Dubai, UAE");
    formData.set("countryCode", "AE");
    formData.set("city", "Dubai");
    formData.set("description", "New company request.");

    await expect(
      submitMembershipOnboardingAction(initialMembershipOnboardingActionState, formData),
    ).rejects.toMatchObject({
      location: "/account?status=verification-requested",
    });

    expect(rpc).toHaveBeenCalledWith("request_company_membership", {
      city: "Dubai",
      company_description: "New company request.",
      company_name: "Regional Labs",
      company_slug: "regional-labs",
      country_code: "AE",
      headquarters_label: "Dubai, UAE",
      website_url: "https://regional.example",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("returns a helpful error when the company slug is already taken", async () => {
    vi.doMock("@/config/env", () => ({
      readSupabasePublicEnvironment: () => ({
        anonKey: "anon-key",
        url: "https://example.supabase.co",
      }),
      resolveEnvironmentStatus: () => ({
        appUrl: "https://nasq.example",
      }),
    }));
    vi.doMock("@/lib/auth/server", () => ({
      getCurrentViewer: vi.fn(async () =>
        createViewerContext({
          isVerifiedMember: false,
          memberships: [],
          primaryCompany: null,
        }),
      ),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => ({
        rpc: vi.fn(async () => ({
          data: null,
          error: {
            code: "23505",
            message: 'duplicate key value violates unique constraint "company_profiles_slug_key"',
          },
        })),
      })),
    }));

    const { submitMembershipOnboardingAction } = await import("@/lib/auth/actions");

    const formData = new FormData();
    formData.set("companyName", "Regional Labs");
    formData.set("companySlug", "regional-labs");
    formData.set("websiteUrl", "");
    formData.set("headquartersLabel", "");
    formData.set("countryCode", "");
    formData.set("city", "");
    formData.set("description", "");

    const result = await submitMembershipOnboardingAction(
      initialMembershipOnboardingActionState,
      formData,
    );

    expect(result.fieldErrors.companySlug).toBe(
      "That company slug is already in use. Choose a more specific company slug.",
    );
  });
});
