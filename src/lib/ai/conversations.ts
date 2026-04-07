type SearchParamsRecord = Record<string, string | string[] | undefined>;

export const guestAiSessionCookieName = "nasq_ai_guest_session";

export const aiSuggestedPrompts = [
  "Equipment downtime in our oil refinery — is this a known issue?",
  "Free solutions for energy waste in UAE commercial buildings?",
  "Healthcare data sharing between hospitals?",
  "Logistics problems during Ramadan season?",
] as const;

export type AiAssistantSearchParams = {
  conversationId: string | null;
  prompt: string;
  status: string | null;
};

export type AiPromptInput = {
  conversationId: string;
  prompt: string;
};

export type AiPromptActionState = {
  fieldErrors: Partial<Record<"prompt", string>>;
  formError: string | null;
};

export const initialAiPromptActionState: AiPromptActionState = {
  fieldErrors: {},
  formError: null,
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeAiAssistantSearchParams(
  searchParams: SearchParamsRecord,
): AiAssistantSearchParams {
  return {
    conversationId: normalizeText(getSingleValue(searchParams.conversation)) || null,
    prompt: normalizeText(getSingleValue(searchParams.prompt)),
    status: normalizeText(getSingleValue(searchParams.status)) || null,
  };
}

export function normalizeAiPromptInput(input: AiPromptInput): AiPromptInput {
  return {
    conversationId: normalizeText(input.conversationId),
    prompt: normalizeText(input.prompt),
  };
}

export function validateAiPromptInput(input: AiPromptInput): AiPromptActionState {
  if (input.prompt.length < 16) {
    return {
      fieldErrors: {
        prompt: "Write a question with at least 16 characters.",
      },
      formError:
        "Enter a clearer discovery question before sending it to the AI assistant.",
    };
  }

  return initialAiPromptActionState;
}

export function buildAiConversationTitle(prompt: string) {
  const normalized = normalizeText(prompt);

  if (normalized.length <= 60) {
    return normalized;
  }

  const truncated = normalized.slice(0, 57);
  const lastSpace = truncated.lastIndexOf(" ");

  return `${(lastSpace > 24 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function detectSector(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (
    normalized.includes("hospital") ||
    normalized.includes("health") ||
    normalized.includes("patient")
  ) {
    return "Healthcare";
  }

  if (
    normalized.includes("logistics") ||
    normalized.includes("port") ||
    normalized.includes("ramadan") ||
    normalized.includes("supply")
  ) {
    return "Logistics & Supply Chain";
  }

  if (
    normalized.includes("energy") ||
    normalized.includes("refinery") ||
    normalized.includes("oil") ||
    normalized.includes("gas")
  ) {
    return "Energy";
  }

  if (
    normalized.includes("police") ||
    normalized.includes("civil defense") ||
    normalized.includes("emergency")
  ) {
    return "Police & Civil Defense";
  }

  return "platform-wide";
}

export function buildAssistantPreviewReply({
  isSignedIn,
  prompt,
}: {
  isSignedIn: boolean;
  prompt: string;
}) {
  const sector = detectSector(prompt);
  const continuityLine = isSignedIn
    ? "This exchange is saved to your signed-in continuity thread so you can return to it later."
    : "This public discovery thread stays in preview mode and can continue on this device.";

  return `Preview mode is active for ${sector} discovery. I can already save the question, keep the conversation history, and route you into the right product surfaces while T15 adds grounded retrieval and citations.\n\nFor the fastest next pass, review related records in /challenges, compare reusable records in /solutions, and use /analytics when you want wider sector context. ${continuityLine}`;
}

export function getAiConversationStatusMessage(status: string | null | undefined) {
  if (status === "thread_created") {
    return "Conversation started. The AI assistant saved your first question and generated a grounded response with internal platform citations.";
  }

  if (status === "message_sent") {
    return "Reply saved. Your AI continuity thread has been updated.";
  }

  if (status === "draft_failed") {
    return "We couldn't turn that conversation into a draft right now. Try again from the saved thread or continue editing your prompt.";
  }

  return null;
}
