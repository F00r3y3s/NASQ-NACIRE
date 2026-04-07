import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialRelayMessageActionState } from "@/lib/relay/messaging";
import {
  createNextRedirectMocks,
  createSupabaseMock,
  createViewerContext,
} from "./helpers/server-action-test-utils";

describe("relay messaging action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("starts a relay thread for a verified responder and redirects back into the member workspace", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const viewer = createViewerContext();
    const { rpcCalls, supabase } = createSupabaseMock({
      rpcResponses: [{ data: "thread-1", error: null }],
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

    const { submitRelayMessageAction } = await import(
      "@/lib/actions/relay-messaging"
    );

    const formData = new FormData();
    formData.set(
      "body",
      "We have a verified interoperability platform and would like to continue this response through the protected relay workflow.",
    );
    formData.set("challengeId", "challenge-1");
    formData.set("challengeSlug", "hospital-interoperability");
    formData.set("solutionId", "solution-1");

    await expect(
      submitRelayMessageAction(initialRelayMessageActionState, formData),
    ).rejects.toMatchObject({
      location: "/account/challenges?thread=thread-1&status=relay_started",
    });
    expect(unstableRethrow).toHaveBeenCalledTimes(1);
    expect(rpcCalls).toEqual([
      {
        args: {
          initial_body:
            "We have a verified interoperability platform and would like to continue this response through the protected relay workflow.",
          target_challenge_id: "challenge-1",
          target_responder_membership_id: "membership-1",
          target_solution_id: "solution-1",
        },
        name: "start_relay_thread",
      },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/account/challenges");
    expect(revalidatePath).toHaveBeenCalledWith(
      "/challenges/hospital-interoperability",
    );
    expect(redirect).toHaveBeenCalledWith(
      "/account/challenges?thread=thread-1&status=relay_started",
    );
  });
});
