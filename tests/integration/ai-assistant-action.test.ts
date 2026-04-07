import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialAiPromptActionState } from "@/lib/ai/conversations";
import {
  createNextRedirectMocks,
  createCookieStoreMock,
  createViewerContext,
  createSupabaseMock,
} from "./helpers/server-action-test-utils";

describe("ai assistant action integration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("stores a guest AI turn through the RPC path and redirects into the saved thread", async () => {
    const revalidatePath = vi.fn();
    const { redirect, unstableRethrow } = createNextRedirectMocks();
    const cookieStore = createCookieStoreMock();
    const viewer = createViewerContext({
      displayName: "Guest",
      email: null,
      initials: "GU",
      isVerifiedMember: false,
      memberships: [],
      platformRole: null,
      primaryCompany: null,
      status: "anonymous",
      userId: null,
    });
    const { rpcCalls, supabase } = createSupabaseMock({
      rpcResponses: [{ data: "conversation-1", error: null }],
    });
    const generateGroundedAiTurn = vi.fn(async () => ({
      assistantReply: "Grounded answer with platform citations.",
      citations: [
        {
          label: "Challenge: Hospital Interoperability",
          recordId: "challenge-1",
          recordType: "challenge",
        },
      ],
    }));

    vi.doMock("next/cache", () => ({ revalidatePath }));
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(async () => cookieStore),
    }));
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
    vi.doMock("@/lib/ai/service", () => ({
      generateGroundedAiTurn,
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      getSupabaseServerClient: vi.fn(async () => supabase),
    }));

    const { submitAiPromptAction } = await import("@/lib/actions/ai-assistant");

    const formData = new FormData();
    formData.set(
      "prompt",
      "Which published healthcare records best match patient-data interoperability challenges in the UAE?",
    );

    await expect(
      submitAiPromptAction(initialAiPromptActionState, formData),
    ).rejects.toMatchObject({
      location: "/ai?conversation=conversation-1&status=thread_created",
    });
    expect(unstableRethrow).toHaveBeenCalledTimes(1);
    expect(generateGroundedAiTurn).toHaveBeenCalledWith({
      isSignedIn: false,
      prompt:
        "Which published healthcare records best match patient-data interoperability challenges in the UAE?",
      supabase,
    });
    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    expect(rpcCalls[0]?.name).toBe("submit_guest_ai_turn");
    expect(rpcCalls[0]?.args).toMatchObject({
      assistant_content: "Grounded answer with platform citations.",
      conversation_title: "Which published healthcare records best match...",
      target_conversation_id: null,
      user_content:
        "Which published healthcare records best match patient-data interoperability challenges in the UAE?",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/ai");
    expect(redirect).toHaveBeenCalledWith(
      "/ai?conversation=conversation-1&status=thread_created",
    );
  });
});
