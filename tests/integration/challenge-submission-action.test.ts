import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialChallengeSubmissionActionState } from "@/lib/challenges/submission";
import {
  createNextRedirectMocks,
  createSupabaseMock,
  createViewerContext,
} from "./helpers/server-action-test-utils";

describe("challenge submission action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("saves a new draft, revalidates the workspace, and redirects to the protected draft route", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const viewer = createViewerContext();
    const { queries, supabase } = createSupabaseMock({
      queryResponses: [
        { data: { id: "sector-1" }, error: null },
        { data: { id: "draft-1" }, error: null },
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

    const { submitChallengeEditorAction } = await import(
      "@/lib/actions/challenge-submission"
    );

    const formData = new FormData();
    formData.set("intent", "save_draft");
    formData.set("sectorId", "sector-1");
    formData.set("title", "Hospital Interoperability");
    formData.set("summary", "Share patient records safely across provider networks.");
    formData.set(
      "problemStatement",
      "Emergency care teams lose critical context because patient records cannot move quickly across hospitals.",
    );
    formData.set("desiredOutcome", "Safer and faster cross-network triage.");
    formData.set("geographyLabel", "UAE");
    formData.set("anonymityMode", "anonymous");

    await expect(
      submitChallengeEditorAction(initialChallengeSubmissionActionState, formData),
    ).rejects.toMatchObject({
      location: "/drafts/draft-1?status=draft-saved",
    });
    expect(unstableRethrow).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/drafts/draft-1?status=draft-saved");
    expect(revalidatePath).toHaveBeenCalledWith("/submit");
    expect(revalidatePath).toHaveBeenCalledWith("/drafts/draft-1");
    expect(queries).toHaveLength(2);
    expect(queries[0]).toMatchObject({
      action: "select",
      filters: [{ column: "id", type: "eq", value: "sector-1" }],
      table: "public_sectors",
    });
    expect(queries[1]).toMatchObject({
      action: "insert",
      table: "challenge_drafts",
    });
    expect(queries[1]?.payload).toMatchObject({
      anonymity_mode: "anonymous",
      geography_label: "UAE",
      owner_membership_id: "membership-1",
      status: "draft",
      title: "Hospital Interoperability",
    });
  });
});
