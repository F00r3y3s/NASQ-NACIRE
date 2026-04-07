import type {
  ChallengeStatus,
  MembershipVerificationStatus,
  SolutionStatus,
} from "@/domain/contracts";

type AdminFieldErrors<FieldName extends string> = Partial<Record<FieldName, string>>;

export type AdminActionState<FieldName extends string = string> = {
  fieldErrors: AdminFieldErrors<FieldName>;
  formError?: string;
};

type ReviewTone = "blue" | "gold" | "green" | "red";

export const adminGovernanceEventNames = [
  "admin_challenge_status_changed",
  "admin_solution_status_changed",
  "admin_sector_created",
  "admin_sector_updated",
  "admin_company_updated",
  "admin_membership_updated",
  "admin_link_created",
  "admin_link_deleted",
] as const;

export type ChallengeModerationStatus = Extract<
  ChallengeStatus,
  "archived" | "published" | "rejected"
>;

export type SolutionModerationStatus = Extract<
  SolutionStatus,
  "archived" | "hidden" | "published" | "under_review"
>;

export type ChallengeModerationField = "challengeId" | "reviewNotes" | "status";
export type SolutionModerationField = "reviewNotes" | "solutionId" | "status";
export type SectorGovernanceField =
  | "description"
  | "displayOrder"
  | "name"
  | "slug";
export type CompanyGovernanceField =
  | "countryCode"
  | "name"
  | "slug"
  | "websiteUrl";
export type LinkCreationField = "challengeId" | "solutionId";
export type MembershipGovernanceField =
  | "companyId"
  | "membershipId"
  | "verificationStatus";

export type ChallengeModerationInput = {
  challengeId: string;
  reviewNotes: string;
  status: string;
};

export type SolutionModerationInput = {
  reviewNotes: string;
  solutionId: string;
  status: string;
};

export type SectorGovernanceInput = {
  description: string;
  displayOrder: string;
  iconKey: string;
  id: string;
  isVisible: boolean;
  name: string;
  slug: string;
};

export type CompanyGovernanceInput = {
  city: string;
  countryCode: string;
  description: string;
  headquartersLabel: string;
  id: string;
  isPublic: boolean;
  name: string;
  slug: string;
  websiteUrl: string;
};

export type LinkCreationInput = {
  challengeId: string;
  solutionId: string;
};

export type MembershipGovernanceInput = {
  companyId: string;
  isPrimary: boolean;
  membershipId: string;
  verificationStatus: string;
};

export const initialChallengeModerationActionState: AdminActionState<ChallengeModerationField> =
  {
    fieldErrors: {},
  };

export const initialSolutionModerationActionState: AdminActionState<SolutionModerationField> = {
  fieldErrors: {},
};

export const initialSectorGovernanceActionState: AdminActionState<SectorGovernanceField> = {
  fieldErrors: {},
};

export const initialCompanyGovernanceActionState: AdminActionState<CompanyGovernanceField> = {
  fieldErrors: {},
};

function normalizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function createEmptySectorGovernanceInput(): SectorGovernanceInput {
  return {
    description: "",
    displayOrder: "0",
    iconKey: "",
    id: "",
    isVisible: true,
    name: "",
    slug: "",
  };
}

export function createEmptyCompanyGovernanceInput(): CompanyGovernanceInput {
  return {
    city: "",
    countryCode: "",
    description: "",
    headquartersLabel: "",
    id: "",
    isPublic: true,
    name: "",
    slug: "",
    websiteUrl: "",
  };
}

export function normalizeChallengeModerationInput(
  input: ChallengeModerationInput,
): ChallengeModerationInput {
  return {
    challengeId: input.challengeId.trim(),
    reviewNotes: normalizeText(input.reviewNotes, 600),
    status: input.status.trim(),
  };
}

export function normalizeSolutionModerationInput(
  input: SolutionModerationInput,
): SolutionModerationInput {
  return {
    reviewNotes: normalizeText(input.reviewNotes, 600),
    solutionId: input.solutionId.trim(),
    status: input.status.trim(),
  };
}

export function normalizeSectorGovernanceInput(
  input: SectorGovernanceInput,
): SectorGovernanceInput {
  return {
    description: normalizeText(input.description, 320),
    displayOrder: input.displayOrder.trim(),
    iconKey: normalizeText(input.iconKey, 48),
    id: input.id.trim(),
    isVisible: input.isVisible,
    name: normalizeText(input.name, 80),
    slug: normalizeText(input.slug, 64).toLowerCase(),
  };
}

export function normalizeCompanyGovernanceInput(
  input: CompanyGovernanceInput,
): CompanyGovernanceInput {
  return {
    city: normalizeText(input.city, 80),
    countryCode: normalizeText(input.countryCode, 2).toUpperCase(),
    description: normalizeText(input.description, 280),
    headquartersLabel: normalizeText(input.headquartersLabel, 120),
    id: input.id.trim(),
    isPublic: input.isPublic,
    name: normalizeText(input.name, 120),
    slug: normalizeText(input.slug, 80).toLowerCase(),
    websiteUrl: normalizeText(input.websiteUrl, 240),
  };
}

export function normalizeLinkCreationInput(
  input: LinkCreationInput,
): LinkCreationInput {
  return {
    challengeId: input.challengeId.trim(),
    solutionId: input.solutionId.trim(),
  };
}

export function normalizeMembershipGovernanceInput(
  input: MembershipGovernanceInput,
): MembershipGovernanceInput {
  return {
    companyId: input.companyId.trim(),
    isPrimary: input.isPrimary,
    membershipId: input.membershipId.trim(),
    verificationStatus: input.verificationStatus.trim(),
  };
}

export function getChallengeStatusLabel(status: ChallengeStatus) {
  if (status === "pending_review") {
    return "Pending Review";
  }

  if (status === "published") {
    return "Published";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Archived";
}

export function getChallengeStatusTone(status: ChallengeStatus): ReviewTone {
  if (status === "pending_review") {
    return "gold";
  }

  if (status === "published") {
    return "green";
  }

  if (status === "rejected") {
    return "red";
  }

  return "blue";
}

export function getSolutionStatusLabel(status: SolutionStatus) {
  if (status === "under_review") {
    return "Under Review";
  }

  if (status === "hidden") {
    return "Hidden";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Published";
}

export function getSolutionStatusTone(status: SolutionStatus): ReviewTone {
  if (status === "under_review") {
    return "gold";
  }

  if (status === "hidden") {
    return "red";
  }

  if (status === "archived") {
    return "blue";
  }

  return "green";
}

export function getMembershipVerificationLabel(
  status: MembershipVerificationStatus,
) {
  if (status === "verified") {
    return "Verified";
  }

  if (status === "suspended") {
    return "Suspended";
  }

  return "Pending";
}

export function getMembershipVerificationTone(
  status: MembershipVerificationStatus,
): ReviewTone {
  if (status === "verified") {
    return "green";
  }

  if (status === "suspended") {
    return "red";
  }

  return "gold";
}

export function validateChallengeModerationInput(
  input: ChallengeModerationInput,
): AdminActionState<ChallengeModerationField> {
  const normalized = normalizeChallengeModerationInput(input);
  const fieldErrors: AdminFieldErrors<ChallengeModerationField> = {};
  const allowedStatuses = new Set<ChallengeModerationStatus>([
    "archived",
    "published",
    "rejected",
  ]);

  if (!normalized.challengeId) {
    fieldErrors.challengeId = "Select a challenge record to review.";
  }

  if (!allowedStatuses.has(normalized.status as ChallengeModerationStatus)) {
    fieldErrors.status = "Choose a valid moderation decision.";
  }

  if (
    (normalized.status === "rejected" || normalized.status === "archived") &&
    normalized.reviewNotes.length < 10
  ) {
    fieldErrors.reviewNotes =
      "Review notes are required when rejecting or archiving a challenge.";
  }

  return {
    fieldErrors,
  };
}

export function validateSolutionModerationInput(
  input: SolutionModerationInput,
): AdminActionState<SolutionModerationField> {
  const normalized = normalizeSolutionModerationInput(input);
  const fieldErrors: AdminFieldErrors<SolutionModerationField> = {};
  const allowedStatuses = new Set<SolutionModerationStatus>([
    "archived",
    "hidden",
    "published",
    "under_review",
  ]);

  if (!normalized.solutionId) {
    fieldErrors.solutionId = "Select a solution record to moderate.";
  }

  if (!allowedStatuses.has(normalized.status as SolutionModerationStatus)) {
    fieldErrors.status = "Choose a valid solution state.";
  }

  if (
    (normalized.status === "hidden" || normalized.status === "archived") &&
    normalized.reviewNotes.length < 10
  ) {
    fieldErrors.reviewNotes =
      "Review notes are required when hiding or archiving a solution.";
  }

  return {
    fieldErrors,
  };
}

export function validateSectorGovernanceInput(
  input: SectorGovernanceInput,
): AdminActionState<SectorGovernanceField> {
  const normalized = normalizeSectorGovernanceInput(input);
  const fieldErrors: AdminFieldErrors<SectorGovernanceField> = {};
  const displayOrder = Number.parseInt(normalized.displayOrder, 10);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.slug)) {
    fieldErrors.slug =
      "Use lowercase letters, numbers, and single hyphens only for the sector slug.";
  }

  if (normalized.name.length < 2) {
    fieldErrors.name = "Sector name must be at least 2 characters.";
  }

  if (normalized.description.length < 12) {
    fieldErrors.description =
      "Add a governed sector description with enough detail for admins and future public reads.";
  }

  if (!Number.isFinite(displayOrder) || displayOrder < 0 || displayOrder > 999) {
    fieldErrors.displayOrder = "Display order must be a number between 0 and 999.";
  }

  return {
    fieldErrors,
  };
}

export function validateCompanyGovernanceInput(
  input: CompanyGovernanceInput,
): AdminActionState<CompanyGovernanceField> {
  const normalized = normalizeCompanyGovernanceInput(input);
  const fieldErrors: AdminFieldErrors<CompanyGovernanceField> = {};
  const rawCountryCode = input.countryCode.trim();

  if (!normalized.name || normalized.name.length < 2) {
    fieldErrors.name = "Company name must be at least 2 characters.";
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.slug)) {
    fieldErrors.slug =
      "Use lowercase letters, numbers, and single hyphens only for the company slug.";
  }

  if (
    normalized.websiteUrl &&
    !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(normalized.websiteUrl)
  ) {
    fieldErrors.websiteUrl =
      "Website URLs must begin with http:// or https:// when provided.";
  }

  if (
    rawCountryCode &&
    (rawCountryCode.length !== 2 || !/^[a-zA-Z]{2}$/.test(rawCountryCode))
  ) {
    fieldErrors.countryCode = "Country code must use a 2-letter ISO format like AE or SA.";
  }

  return {
    fieldErrors,
  };
}

export function validateLinkCreationInput(
  input: LinkCreationInput,
): AdminActionState<LinkCreationField> {
  const normalized = normalizeLinkCreationInput(input);
  const fieldErrors: AdminFieldErrors<LinkCreationField> = {};

  if (!normalized.challengeId) {
    fieldErrors.challengeId = "Choose a published challenge.";
  }

  if (!normalized.solutionId) {
    fieldErrors.solutionId = "Choose a published solution.";
  }

  return {
    fieldErrors,
  };
}

export function validateMembershipGovernanceInput(
  input: MembershipGovernanceInput,
): AdminActionState<MembershipGovernanceField> {
  const normalized = normalizeMembershipGovernanceInput(input);
  const fieldErrors: AdminFieldErrors<MembershipGovernanceField> = {};
  const allowedStatuses = new Set<MembershipVerificationStatus>([
    "pending",
    "verified",
    "suspended",
  ]);

  if (!normalized.companyId) {
    fieldErrors.companyId = "Select a governed company profile.";
  }

  if (!normalized.membershipId) {
    fieldErrors.membershipId = "Choose a membership to update.";
  }

  if (!allowedStatuses.has(normalized.verificationStatus as MembershipVerificationStatus)) {
    fieldErrors.verificationStatus = "Choose a valid membership verification state.";
  }

  return {
    fieldErrors,
  };
}

export function getModerationStatusMessage(status: string | null | undefined) {
  if (status === "challenge-reviewed") {
    return "Challenge moderation saved. The governance queue now reflects the new review state.";
  }

  if (status === "solution-reviewed") {
    return "Solution override saved. Discovery surfaces will respect the new solution state.";
  }

  return null;
}

export function getSectorGovernanceStatusMessage(status: string | null | undefined) {
  if (status === "sector-created") {
    return "Governed sector created. It is now available to later admin and discovery flows.";
  }

  if (status === "sector-updated") {
    return "Sector governance saved. Public discovery will follow the updated metadata and visibility settings.";
  }

  return null;
}

export function getCompanyGovernanceStatusMessage(status: string | null | undefined) {
  if (status === "company-updated") {
    return "Company governance saved. Public profile visibility and metadata are now up to date.";
  }

  if (status === "membership-updated") {
    return "Membership governance saved. Verification and trust state have been updated.";
  }

  return null;
}

export function getLinkOversightStatusMessage(status: string | null | undefined) {
  if (status === "link-created") {
    return "Challenge-solution link created. It will now appear across linked discovery contexts where visibility rules allow.";
  }

  if (status === "link-deleted") {
    return "Challenge-solution link removed. Discovery surfaces will drop the association on the next refresh.";
  }

  return null;
}
