import type { SolutionAccessModel } from "@/domain/contracts";

export type SolutionAuthoringInput = {
  accessModel: SolutionAccessModel;
  coverageLabel: string;
  linkedChallengeIds: string[];
  offeringDescription: string;
  sectorId: string;
  solutionId: string;
  summary: string;
  title: string;
};

export type SolutionAuthoringFieldName =
  | "accessModel"
  | "coverageLabel"
  | "linkedChallengeIds"
  | "offeringDescription"
  | "sectorId"
  | "summary"
  | "title";

export type SolutionAuthoringActionState = {
  fieldErrors: Partial<Record<SolutionAuthoringFieldName, string>>;
  formError: string | null;
};

export const initialSolutionAuthoringActionState: SolutionAuthoringActionState = {
  fieldErrors: {},
  formError: null,
};

export const solutionAccessModelOptions = [
  {
    description: "Open playbooks, frameworks, or public tooling anyone can adopt.",
    label: "Free Solution",
    value: "free",
  },
  {
    description: "Commercial offer with pricing, procurement, or deployment services attached.",
    label: "Paid Solution",
    value: "paid",
  },
  {
    description: "Invite teams to start a direct discussion before scoping the engagement.",
    label: "Contact Provider",
    value: "contact",
  },
] as const satisfies readonly {
  description: string;
  label: string;
  value: SolutionAccessModel;
}[];

export const solutionCoverageOptions = [
  { label: "UAE Only", value: "UAE" },
  { label: "UAE + GCC Region", value: "UAE + GCC" },
  { label: "GCC Region", value: "GCC" },
  { label: "MENA Region", value: "MENA" },
  { label: "Worldwide", value: "Global" },
] as const;

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function normalizeTextarea(value: string | null | undefined) {
  return (value ?? "").replace(/\r\n/g, "\n").trim();
}

function normalizeLinkedChallengeIds(
  value:
    | string
    | string[]
    | null
    | readonly string[]
    | undefined,
) {
  const entries = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];

  return [...new Set(entries.map((entry) => normalizeText(entry)).filter(Boolean))];
}

export function createEmptySolutionAuthoringInput(): SolutionAuthoringInput {
  return {
    accessModel: "contact",
    coverageLabel: "UAE + GCC",
    linkedChallengeIds: [],
    offeringDescription: "",
    sectorId: "",
    solutionId: "",
    summary: "",
    title: "",
  };
}

export function normalizeSolutionAuthoringInput(
  source: Partial<
    Record<
      keyof Omit<SolutionAuthoringInput, "linkedChallengeIds">,
      string | null | undefined
    >
  > & {
    linkedChallengeIds?: string | readonly string[] | null;
  },
): SolutionAuthoringInput {
  const accessModel =
    source.accessModel === "free" ||
    source.accessModel === "paid" ||
    source.accessModel === "contact"
      ? source.accessModel
      : "contact";

  return {
    accessModel,
    coverageLabel: normalizeText(source.coverageLabel),
    linkedChallengeIds: normalizeLinkedChallengeIds(source.linkedChallengeIds),
    offeringDescription: normalizeTextarea(source.offeringDescription),
    sectorId: normalizeText(source.sectorId),
    solutionId: normalizeText(source.solutionId),
    summary: normalizeTextarea(source.summary),
    title: normalizeText(source.title),
  };
}

export function validateSolutionAuthoring(
  input: SolutionAuthoringInput,
): SolutionAuthoringActionState {
  const fieldErrors: SolutionAuthoringActionState["fieldErrors"] = {};

  if (!input.sectorId) {
    fieldErrors.sectorId = "Select a governed sector.";
  }

  if (input.title.length < 8) {
    fieldErrors.title = "Use a solution title with at least 8 characters.";
  } else if (input.title.length > 120) {
    fieldErrors.title = "Keep the title within 120 characters.";
  }

  if (input.summary.length < 24) {
    fieldErrors.summary = "Write a summary with at least 24 characters.";
  } else if (input.summary.length > 280) {
    fieldErrors.summary = "Keep the summary within 280 characters.";
  }

  if (input.offeringDescription.length < 60) {
    fieldErrors.offeringDescription =
      "Provide an offering description with at least 60 characters.";
  } else if (input.offeringDescription.length > 4_000) {
    fieldErrors.offeringDescription =
      "Keep the offering description within 4,000 characters.";
  }

  if (input.coverageLabel.length > 120) {
    fieldErrors.coverageLabel = "Keep the coverage label within 120 characters.";
  }

  if (
    input.accessModel !== "free" &&
    input.accessModel !== "paid" &&
    input.accessModel !== "contact"
  ) {
    fieldErrors.accessModel = "Choose a valid access model.";
  }

  return Object.keys(fieldErrors).length > 0
    ? {
        fieldErrors,
        formError: "Complete the required fields before publishing this solution.",
      }
    : initialSolutionAuthoringActionState;
}

export function hasSolutionAuthoringErrors(
  state: SolutionAuthoringActionState,
) {
  return Boolean(state.formError) || Object.keys(state.fieldErrors).length > 0;
}

export function calculateSolutionAuthoringCompletion(
  input: SolutionAuthoringInput,
) {
  const requiredChecks = [
    Boolean(input.sectorId),
    Boolean(input.title),
    Boolean(input.summary),
    Boolean(input.offeringDescription),
    Boolean(input.accessModel),
  ];

  return {
    completed: requiredChecks.filter(Boolean).length,
    total: requiredChecks.length,
  };
}

export function createSolutionSlug(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");

  return normalized || "solution";
}

export function buildSolutionInsertMutation({
  companyId,
  input,
  ownerMembershipId,
  slug,
}: {
  companyId: string;
  input: SolutionAuthoringInput;
  ownerMembershipId: string;
  slug: string;
}) {
  return {
    access_model: input.accessModel,
    company_id: companyId,
    coverage_label: input.coverageLabel || null,
    offering_description: input.offeringDescription,
    owner_membership_id: ownerMembershipId,
    sector_id: input.sectorId,
    slug,
    summary: input.summary,
    title: input.title,
  };
}

export function buildSolutionUpdateMutation({
  input,
}: {
  input: SolutionAuthoringInput;
}) {
  return {
    access_model: input.accessModel,
    coverage_label: input.coverageLabel || null,
    offering_description: input.offeringDescription,
    sector_id: input.sectorId,
    summary: input.summary,
    title: input.title,
  };
}

export function buildChallengeSolutionLinkInsertRows({
  challengeIds,
  linkedByUserId,
  solutionId,
}: {
  challengeIds: string[];
  linkedByUserId: string | null;
  solutionId: string;
}) {
  return challengeIds.map((challengeId) => ({
    challenge_id: challengeId,
    linked_by_user_id: linkedByUserId,
    solution_id: solutionId,
  }));
}
