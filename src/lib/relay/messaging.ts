import type { RelayThreadStatus } from "@/domain/contracts";

export type RelayComposerInput = {
  body: string;
  challengeId: string;
  challengeSlug: string;
  solutionId: string;
  threadId: string;
};

export type RelayMessageActionState = {
  fieldErrors: Partial<Record<"body" | "challengeId" | "solutionId" | "threadId", string>>;
  formError: string | null;
};

export const initialRelayMessageActionState: RelayMessageActionState = {
  fieldErrors: {},
  formError: null,
};

function getSingleLineText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeRelayComposerInput(input: RelayComposerInput): RelayComposerInput {
  return {
    body: getSingleLineText(input.body),
    challengeId: input.challengeId.trim(),
    challengeSlug: input.challengeSlug.trim(),
    solutionId: input.solutionId.trim(),
    threadId: input.threadId.trim(),
  };
}

export function validateRelayComposerInput(
  input: RelayComposerInput,
): RelayMessageActionState {
  const fieldErrors: RelayMessageActionState["fieldErrors"] = {};

  if (input.body.length < 24) {
    fieldErrors.body = "Write a relay message with at least 24 characters.";
  }

  if (!input.threadId && (!input.challengeId || !input.challengeSlug)) {
    fieldErrors.challengeId =
      "Choose an anonymous challenge or existing relay thread before sending a message.";
  }

  return Object.keys(fieldErrors).length > 0
    ? {
        fieldErrors,
        formError: "Complete the required relay fields before sending your message.",
      }
    : initialRelayMessageActionState;
}

export function buildStartRelayThreadPayload({
  body,
  challengeId,
  responderMembershipId,
  solutionId,
}: {
  body: string;
  challengeId: string;
  responderMembershipId: string;
  solutionId: string;
}) {
  return {
    initial_body: body,
    target_challenge_id: challengeId,
    target_responder_membership_id: responderMembershipId,
    target_solution_id: solutionId || null,
  };
}

export function buildPostRelayMessagePayload({
  body,
  threadId,
}: {
  body: string;
  threadId: string;
}) {
  return {
    message_body: body,
    target_thread_id: threadId,
  };
}

export function getRelayCounterpartLabel({
  perspective,
  solutionCompanyName,
}: {
  perspective: "challenge_owner" | "responder";
  solutionCompanyName: string | null;
}) {
  if (perspective === "responder") {
    return "Anonymous challenge owner";
  }

  return solutionCompanyName ?? "Verified responder";
}

export function getRelayThreadStatusLabel(status: RelayThreadStatus) {
  if (status === "closed") {
    return "Closed relay";
  }

  if (status === "archived") {
    return "Archived relay";
  }

  return "Open relay";
}

export function getRelayThreadStatusTone(status: RelayThreadStatus) {
  if (status === "closed") {
    return "gold" as const;
  }

  if (status === "archived") {
    return "blue" as const;
  }

  return "green" as const;
}

export function getRelayWorkspaceStatusMessage(status: string | null | undefined) {
  if (status === "relay_started") {
    return "Relay thread started. Your message is now visible inside the protected challenge workspace.";
  }

  if (status === "message_sent") {
    return "Message sent. The protected relay thread has been refreshed with your latest reply.";
  }

  return null;
}

export function formatRelayTimestamp(value: string | null) {
  if (!value) {
    return "Awaiting activity";
  }

  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function truncateRelayPreview(value: string, limit = 88) {
  const normalized = getSingleLineText(value);

  return normalized.length > limit ? `${normalized.slice(0, limit - 1)}…` : normalized;
}
