import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  aiSuggestedPrompts,
  buildAiConversationTitle,
  buildAssistantPreviewReply,
  getAiConversationStatusMessage,
  guestAiSessionCookieName,
  normalizeAiAssistantSearchParams,
  normalizeAiPromptInput,
  validateAiPromptInput,
} from "@/lib/ai/conversations";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260406170000_t14_guest_ai_conversation_functions.sql",
);

describe("ai assistant helpers", () => {
  it("normalizes AI search params and prompt input into stable values", () => {
    expect(
      normalizeAiAssistantSearchParams({
        conversation: [" convo-1 ", "convo-2"],
        prompt:
          "  Hospital data sharing between providers in the UAE and GCC?  ",
        status: " thread_created ",
      }),
    ).toEqual({
      conversationId: "convo-1",
      prompt:
        "Hospital data sharing between providers in the UAE and GCC?",
      status: "thread_created",
    });

    expect(
      normalizeAiPromptInput({
        conversationId: " convo-1 ",
        prompt:
          "  Show me logistics coordination issues during Ramadan and peak-season demand.  ",
      }),
    ).toEqual({
      conversationId: "convo-1",
      prompt:
        "Show me logistics coordination issues during Ramadan and peak-season demand.",
    });
  });

  it("requires a substantial AI prompt and derives compact conversation titles", () => {
    expect(
      validateAiPromptInput({
        conversationId: "",
        prompt: "Too short",
      }),
    ).toEqual({
      fieldErrors: {
        prompt: "Write a question with at least 16 characters.",
      },
      formError: "Enter a clearer discovery question before sending it to the AI assistant.",
    });

    expect(
      buildAiConversationTitle(
        "How can hospitals improve data interoperability without exposing patient identity in cross-network triage?",
      ),
    ).toBe("How can hospitals improve data interoperability without...");
  });

  it("builds preview-mode assistant replies without pretending retrieval is finished", () => {
    const energyReply = buildAssistantPreviewReply({
      isSignedIn: false,
      prompt: "Free solutions for energy waste in UAE commercial buildings?",
    });
    const healthcareReply = buildAssistantPreviewReply({
      isSignedIn: true,
      prompt: "Healthcare data sharing between hospitals?",
    });

    expect(energyReply).toContain("Energy");
    expect(energyReply).toContain("/solutions");
    expect(energyReply).toContain("preview mode");
    expect(healthcareReply).toContain("Healthcare");
    expect(healthcareReply).toContain("saved to your signed-in continuity thread");
  });

  it("locks suggested prompts, guest cookie name, and user-facing status copy", () => {
    expect(guestAiSessionCookieName).toBe("nasq_ai_guest_session");
    expect(aiSuggestedPrompts).toHaveLength(4);
    expect(getAiConversationStatusMessage("thread_created")).toContain("Conversation started");
    expect(getAiConversationStatusMessage("message_sent")).toContain("Reply saved");
  });

  it("materializes the guest AI conversation migration", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    expect(migrationSql).toContain("create or replace function public.list_guest_ai_conversations(");
    expect(migrationSql).toContain("create or replace function public.list_guest_ai_messages(");
    expect(migrationSql).toContain("create or replace function public.submit_guest_ai_turn(");
    expect(migrationSql).toContain("guest_session_key = target_guest_session_key");
    expect(migrationSql).toContain("access_scope = 'public'");
    expect(migrationSql).toContain("grant execute on function public.submit_guest_ai_turn");
  });
});
