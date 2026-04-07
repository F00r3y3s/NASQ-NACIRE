import type { ChallengeAnonymityMode, ChallengeDraftStatus, ChallengeStatus } from "@/domain/contracts";
import { selectVerifiedContributionMembership } from "@/lib/contributions/memberships";

export type ChallengeSubmissionIntent = "save_draft" | "submit_for_review";

export type ChallengeSubmissionInput = {
  anonymityMode: ChallengeAnonymityMode;
  desiredOutcome: string;
  draftId: string;
  geographyLabel: string;
  problemStatement: string;
  sectorId: string;
  sourceConversationId: string;
  summary: string;
  title: string;
};

export type ChallengeSubmissionFieldName =
  | "anonymityMode"
  | "desiredOutcome"
  | "geographyLabel"
  | "problemStatement"
  | "sectorId"
  | "summary"
  | "title";

export type ChallengeSubmissionActionState = {
  fieldErrors: Partial<Record<ChallengeSubmissionFieldName, string>>;
  formError: string | null;
};

export const initialChallengeSubmissionActionState: ChallengeSubmissionActionState = {
  fieldErrors: {},
  formError: null,
};

export const challengeGeographyOptions = [
  { label: "UAE Only", value: "UAE" },
  { label: "UAE + GCC Region", value: "UAE + GCC" },
  { label: "MENA Region", value: "MENA" },
  { label: "Worldwide", value: "Global" },
] as const;

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeTextarea(value: string | null | undefined) {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

export function createEmptyChallengeSubmissionInput(): ChallengeSubmissionInput {
  return {
    anonymityMode: "named",
    desiredOutcome: "",
    draftId: "",
    geographyLabel: "UAE + GCC",
    problemStatement: "",
    sectorId: "",
    sourceConversationId: "",
    summary: "",
    title: "",
  };
}

export function normalizeChallengeSubmissionInput(
  source: Partial<Record<keyof ChallengeSubmissionInput, string | null | undefined>>,
): ChallengeSubmissionInput {
  return {
    anonymityMode: source.anonymityMode === "anonymous" ? "anonymous" : "named",
    desiredOutcome: normalizeTextarea(source.desiredOutcome),
    draftId: normalizeText(source.draftId),
    geographyLabel: normalizeText(source.geographyLabel),
    problemStatement: normalizeTextarea(source.problemStatement),
    sectorId: normalizeText(source.sectorId),
    sourceConversationId: normalizeText(source.sourceConversationId),
    summary: normalizeTextarea(source.summary),
    title: normalizeText(source.title),
  };
}

export function resolveChallengeSubmissionIntent(
  value: string | null | undefined,
): ChallengeSubmissionIntent {
  return value === "submit_for_review" ? "submit_for_review" : "save_draft";
}

export function validateChallengeSubmission(
  input: ChallengeSubmissionInput,
  intent: ChallengeSubmissionIntent,
): ChallengeSubmissionActionState {
  if (intent === "save_draft") {
    const hasAnyContent = Boolean(
      input.sectorId ||
        input.title ||
        input.summary ||
        input.problemStatement ||
        input.desiredOutcome ||
        input.geographyLabel,
    );

    if (!hasAnyContent) {
      return {
        fieldErrors: {},
        formError: "Add at least one field before saving a draft.",
      };
    }

    return initialChallengeSubmissionActionState;
  }

  const fieldErrors: ChallengeSubmissionActionState["fieldErrors"] = {};

  if (!input.sectorId) {
    fieldErrors.sectorId = "Select a governed sector.";
  }

  if (input.title.length < 8) {
    fieldErrors.title = "Use a challenge title with at least 8 characters.";
  } else if (input.title.length > 120) {
    fieldErrors.title = "Keep the title within 120 characters.";
  }

  if (input.summary.length < 24) {
    fieldErrors.summary = "Write a summary with at least 24 characters.";
  } else if (input.summary.length > 280) {
    fieldErrors.summary = "Keep the summary within 280 characters.";
  }

  if (input.problemStatement.length < 40) {
    fieldErrors.problemStatement =
      "Provide a detailed problem statement with at least 40 characters.";
  } else if (input.problemStatement.length > 4_000) {
    fieldErrors.problemStatement = "Keep the problem statement within 4,000 characters.";
  }

  if (!input.geographyLabel) {
    fieldErrors.geographyLabel = "Select a geography scope.";
  }

  if (
    input.desiredOutcome &&
    input.desiredOutcome.length > 600
  ) {
    fieldErrors.desiredOutcome = "Keep the desired outcome within 600 characters.";
  }

  return Object.keys(fieldErrors).length > 0
    ? {
        fieldErrors,
        formError: "Complete the required fields before submitting for review.",
      }
    : initialChallengeSubmissionActionState;
}

export function hasChallengeSubmissionErrors(
  state: ChallengeSubmissionActionState,
) {
  return Boolean(state.formError) || Object.keys(state.fieldErrors).length > 0;
}

export function calculateChallengeSubmissionCompletion(
  input: ChallengeSubmissionInput,
) {
  const requiredChecks = [
    Boolean(input.sectorId),
    Boolean(input.title),
    Boolean(input.summary),
    Boolean(input.problemStatement),
    Boolean(input.geographyLabel),
  ];

  return {
    completed: requiredChecks.filter(Boolean).length,
    total: requiredChecks.length,
  };
}

export function createChallengeSlug(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");

  return normalized || "challenge";
}

export function selectChallengeSubmissionMembership(
  memberships: Parameters<typeof selectVerifiedContributionMembership>[0],
) {
  return selectVerifiedContributionMembership(memberships);
}

export function buildChallengeDraftMutation({
  input,
  ownerMembershipId,
  status,
  submittedChallengeId = null,
}: {
  input: ChallengeSubmissionInput;
  ownerMembershipId: string;
  status: ChallengeDraftStatus;
  submittedChallengeId?: string | null;
}) {
  return {
    anonymity_mode: input.anonymityMode,
    desired_outcome: input.desiredOutcome || null,
    geography_label: input.geographyLabel || null,
    owner_membership_id: ownerMembershipId,
    problem_statement: input.problemStatement || null,
    sector_id: input.sectorId || null,
    source_conversation_id: input.sourceConversationId || null,
    status,
    submitted_challenge_id: submittedChallengeId,
    summary: input.summary || null,
    title: input.title || null,
  };
}

export function buildChallengeInsertMutation({
  companyId,
  input,
  ownerMembershipId,
  slug,
}: {
  companyId: string;
  input: ChallengeSubmissionInput;
  ownerMembershipId: string;
  slug: string;
}) {
  return {
    anonymity_mode: input.anonymityMode,
    company_id: companyId,
    desired_outcome: input.desiredOutcome || null,
    geography_label: input.geographyLabel || null,
    owner_membership_id: ownerMembershipId,
    problem_statement: input.problemStatement,
    sector_id: input.sectorId,
    slug,
    status: "pending_review" as ChallengeStatus,
    summary: input.summary,
    title: input.title,
  };
}
