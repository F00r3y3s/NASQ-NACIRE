import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialSolutionAuthoringActionState } from "@/lib/solutions/authoring";
import {
  createNextRedirectMocks,
  createSupabaseMock,
  createViewerContext,
} from "./helpers/server-action-test-utils";

describe("solution authoring action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("publishes a solution, persists challenge links, and revalidates discovery surfaces", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const viewer = createViewerContext();
    const { queries, supabase } = createSupabaseMock({
      queryResponses: [
        { data: { id: "sector-1" }, error: null },
        {
          data: [{ id: "challenge-1", slug: "hospital-interoperability" }],
          error: null,
        },
        {
          data: { id: "solution-1", slug: "secure-data-exchange" },
          error: null,
        },
        { data: null, error: null },
      ],
    });

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
    }));
    vi.doMock("@/lib/auth/server", () => ({
      getCurrentViewer: vi.fn(async () => viewer),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => supabase),
    }));

    const { submitSolutionAuthoringAction } = await import(
      "@/lib/actions/solution-authoring"
    );

    const formData = new FormData();
    formData.set("sectorId", "sector-1");
    formData.set("title", "Secure Data Exchange");
    formData.set("summary", "Protected interoperability fabric for health systems.");
    formData.set(
      "offeringDescription",
      "Routes consent-aware patient data between providers with audit logs and policy controls.",
    );
    formData.set("coverageLabel", "UAE + GCC");
    formData.set("accessModel", "contact");
    formData.append("linkedChallengeIds", "challenge-1");

    await expect(
      submitSolutionAuthoringAction(initialSolutionAuthoringActionState, formData),
    ).rejects.toMatchObject({
      location: "/account/solutions?solution=solution-1&status=published",
    });
    expect(unstableRethrow).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith(
      "/account/solutions?solution=solution-1&status=published",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/challenges");
    expect(revalidatePath).toHaveBeenCalledWith("/solutions");
    expect(revalidatePath).toHaveBeenCalledWith("/account/solutions");
    expect(revalidatePath).toHaveBeenCalledWith("/solutions/secure-data-exchange");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/challenges/hospital-interoperability",
    );
    expect(queries.map((query) => `${query.table}:${query.action}`)).toEqual([
      "public_sectors:select",
      "public_challenges:select",
      "solutions:insert",
      "challenge_solution_links:insert",
    ]);
    expect(queries[2]?.payload).toMatchObject({
      access_model: "contact",
      company_id: "company-1",
      coverage_label: "UAE + GCC",
      owner_membership_id: "membership-1",
      title: "Secure Data Exchange",
    });
  });
});
