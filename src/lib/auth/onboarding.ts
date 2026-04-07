function normalizeText(value: string, maxLength: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function isAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export type MembershipOnboardingField =
  | "city"
  | "companyName"
  | "companySlug"
  | "countryCode"
  | "description"
  | "headquartersLabel"
  | "websiteUrl";

export type MembershipOnboardingInput = {
  city: string;
  companyName: string;
  companySlug: string;
  countryCode: string;
  description: string;
  headquartersLabel: string;
  websiteUrl: string;
};

export type MembershipOnboardingFieldErrors = Partial<
  Record<MembershipOnboardingField, string>
>;

export type MembershipOnboardingActionState = {
  defaultValues: MembershipOnboardingInput;
  fieldErrors: MembershipOnboardingFieldErrors;
  formError: string | null;
};

export function createEmptyMembershipOnboardingInput(): MembershipOnboardingInput {
  return {
    city: "",
    companyName: "",
    companySlug: "",
    countryCode: "",
    description: "",
    headquartersLabel: "",
    websiteUrl: "",
  };
}

export const initialMembershipOnboardingActionState: MembershipOnboardingActionState = {
  defaultValues: createEmptyMembershipOnboardingInput(),
  fieldErrors: {},
  formError: null,
};

export function createCompanySlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function normalizeMembershipOnboardingInput(
  input: MembershipOnboardingInput,
): MembershipOnboardingInput {
  const companyName = normalizeText(input.companyName, 120);
  const providedSlug = normalizeText(input.companySlug, 80).toLowerCase();

  return {
    city: normalizeText(input.city, 80),
    companyName,
    companySlug: providedSlug || createCompanySlug(companyName),
    countryCode: normalizeText(input.countryCode, 2).toUpperCase(),
    description: normalizeText(input.description, 280),
    headquartersLabel: normalizeText(input.headquartersLabel, 120),
    websiteUrl: normalizeText(input.websiteUrl, 240),
  };
}

export function validateMembershipOnboardingInput(
  input: MembershipOnboardingInput,
): MembershipOnboardingFieldErrors {
  const fieldErrors: MembershipOnboardingFieldErrors = {};

  if (!input.companyName) {
    fieldErrors.companyName = "Enter your company name before requesting verification.";
  }

  if (!input.companySlug) {
    fieldErrors.companySlug =
      "Add a company slug, or use a company name that can be turned into one.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.companySlug)) {
    fieldErrors.companySlug =
      "Use lowercase letters, numbers, and single hyphens only for the company slug.";
  }

  if (input.websiteUrl && !isAbsoluteHttpUrl(input.websiteUrl)) {
    fieldErrors.websiteUrl =
      "Enter a valid website URL starting with http:// or https://.";
  }

  if (input.countryCode && !/^[A-Z]{2}$/.test(input.countryCode)) {
    fieldErrors.countryCode = "Use a valid 2-letter country code such as AE or SA.";
  }

  return fieldErrors;
}
