import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialChallengeModerationActionState } from "@/lib/admin/governance";
import {
  createNextRedirectMocks,
  createViewerContext,
  createSupabaseMock,
} from "./helpers/server-action-test-utils";

describe("admin governance action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("saves a challenge moderation decision, writes an audit event, and revalidates governance surfaces", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const viewer = createViewerContext({
      isAdmin: true,
      platformRole: "admin",
    });
    const { queries, supabase } = createSupabaseMock({
      queryResponses: [
        {
          data: {
            id: "challenge-1",
            published_at: null,
            slug: "hospital-interoperability",
            status: "pending_review",
            title: "Hospital Interoperability",
          },
          error: null,
        },
        { data: null, error: null },
        { data: null, error: null },
      ],
    });

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("next/navigation", () => ({
      redirect,
      unstable_rethrow: unstableRethrow,
    }));
    vi.doMock("@/lib/auth/server", () => ({
      getCurrentViewer: vi.fn(async () => viewer),
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => supabase),
    }));

    const { submitChallengeModerationAction } = await import(
      "@/lib/actions/admin-governance"
    );

    const formData = new FormData();
    formData.set("challengeId", "challenge-1");
    formData.set("status", "published");
    formData.set("reviewNotes", "Approved for public publication.");

    await expect(
      submitChallengeModerationAction(initialChallengeModerationActionState, formData),
    ).rejects.toMatchObject({
      location: "/admin/moderation?challenge=challenge-1&status=challenge-reviewed",
    });
    expect(unstableRethrow).toHaveBeenCalledTimes(1);
    expect(queries.map((query) => `${query.table}:${query.action}`)).toEqual([
      "challenges:select",
      "challenges:update",
      "analytics_events:insert",
    ]);
    expect(queries[1]?.payload).toMatchObject({
      review_notes: "Approved for public publication.",
      reviewed_by_user_id: "user-1",
      status: "published",
    });
    expect(queries[2]?.payload).toMatchObject({
      actor_kind: "authenticated",
      actor_user_id: "user-1",
      event_name: "admin_challenge_status_changed",
      resource_id: "challenge-1",
      resource_kind: "challenge",
      route: "/admin/moderation",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/moderation");
    expect(revalidatePath).toHaveBeenCalledWith("/account/challenges");
    expect(revalidatePath).toHaveBeenCalledWith("/challenges/hospital-interoperability");
    expect(redirect).toHaveBeenCalledWith(
      "/admin/moderation?challenge=challenge-1&status=challenge-reviewed",
    );
  });
});
