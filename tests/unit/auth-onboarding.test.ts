import { describe, expect, it } from "vitest";

import {
  createCompanySlug,
  normalizeMembershipOnboardingInput,
  validateMembershipOnboardingInput,
} from "@/lib/auth/onboarding";

describe("auth onboarding helpers", () => {
  it("creates a clean company slug from free-form company names", () => {
    expect(createCompanySlug("  Gulf Grid Utilities LLC  ")).toBe("gulf-grid-utilities-llc");
    expect(createCompanySlug("NASQ / Aviation + Ops")).toBe("nasq-aviation-ops");
    expect(createCompanySlug("!!!")).toBe("");
  });

  it("normalizes onboarding input and derives a slug when one is not provided", () => {
    const normalized = normalizeMembershipOnboardingInput({
      city: "  Abu   Dhabi ",
      companyName: "  Clinical Flow Systems  ",
      companySlug: "",
      countryCode: " ae ",
      description: "  Member onboarding request for hospital command workflows. ",
      headquartersLabel: "  Abu Dhabi, UAE ",
      websiteUrl: " https://clinicalflow.example/platform ",
    });

    expect(normalized).toEqual({
      city: "Abu Dhabi",
      companyName: "Clinical Flow Systems",
      companySlug: "clinical-flow-systems",
      countryCode: "AE",
      description: "Member onboarding request for hospital command workflows.",
      headquartersLabel: "Abu Dhabi, UAE",
      websiteUrl: "https://clinicalflow.example/platform",
    });
  });

  it("validates required and malformed onboarding fields", () => {
    const errors = validateMembershipOnboardingInput({
      city: "",
      companyName: "",
      companySlug: "Bad Slug",
      countryCode: "UAE",
      description: "",
      headquartersLabel: "",
      websiteUrl: "ftp://invalid.example",
    });

    expect(errors.companyName).toBeTruthy();
    expect(errors.companySlug).toBeTruthy();
    expect(errors.countryCode).toBeTruthy();
    expect(errors.websiteUrl).toBeTruthy();
  });
});
