import { describe, expect, it } from "vitest";

import {
  buildChallengeSolutionLinkInsertRows,
  buildSolutionInsertMutation,
  buildSolutionUpdateMutation,
  calculateSolutionAuthoringCompletion,
  createSolutionSlug,
  normalizeSolutionAuthoringInput,
  validateSolutionAuthoring,
} from "@/lib/solutions/authoring";

describe("solution authoring helpers", () => {
  it("normalizes raw form values into stable solution input", () => {
    expect(
      normalizeSolutionAuthoringInput({
        accessModel: "paid",
        coverageLabel: "  UAE + GCC  ",
        linkedChallengeIds: [" challenge-1 ", "challenge-2", "challenge-1"],
        offeringDescription: "  Deploys a digital twin layer for asset risk scoring. ",
        sectorId: " sector-1 ",
        solutionId: " solution-1 ",
        summary: "  Maps corrosion risk across legacy assets. ",
        title: "  Pipeline Risk Intelligence  ",
      }),
    ).toEqual({
      accessModel: "paid",
      coverageLabel: "UAE + GCC",
      linkedChallengeIds: ["challenge-1", "challenge-2"],
      offeringDescription: "Deploys a digital twin layer for asset risk scoring.",
      sectorId: "sector-1",
      solutionId: "solution-1",
      summary: "Maps corrosion risk across legacy assets.",
      title: "Pipeline Risk Intelligence",
    });
  });

  it("requires the core publishing fields", () => {
    expect(
      validateSolutionAuthoring(
        normalizeSolutionAuthoringInput({
          accessModel: "contact",
          coverageLabel: "",
          linkedChallengeIds: [],
          offeringDescription: "Too short",
          sectorId: "",
          solutionId: "",
          summary: "Short",
          title: "Test",
        }),
      ),
    ).toEqual({
      fieldErrors: {
        offeringDescription: "Provide an offering description with at least 60 characters.",
        sectorId: "Select a governed sector.",
        summary: "Write a summary with at least 24 characters.",
        title: "Use a solution title with at least 8 characters.",
      },
      formError: "Complete the required fields before publishing this solution.",
    });
  });

  it("builds solution and challenge-link mutations from validated input", () => {
    const input = normalizeSolutionAuthoringInput({
      accessModel: "free",
      coverageLabel: "Global",
      linkedChallengeIds: ["challenge-1", "challenge-2"],
      offeringDescription:
        "Deploys autonomous sensing, anomaly scoring, and operator workflows to detect risk before corrosion escalates across subsea assets.",
      sectorId: "sector-energy",
      solutionId: "solution-1",
      summary: "Autonomous mapping stack for early subsea corrosion detection.",
      title: "Subsea Corrosion Mapping",
    });

    expect(
      buildSolutionInsertMutation({
        companyId: "company-1",
        input,
        ownerMembershipId: "membership-1",
        slug: "subsea-corrosion-mapping",
      }),
    ).toEqual({
      access_model: "free",
      company_id: "company-1",
      coverage_label: "Global",
      offering_description:
        "Deploys autonomous sensing, anomaly scoring, and operator workflows to detect risk before corrosion escalates across subsea assets.",
      owner_membership_id: "membership-1",
      sector_id: "sector-energy",
      slug: "subsea-corrosion-mapping",
      summary: "Autonomous mapping stack for early subsea corrosion detection.",
      title: "Subsea Corrosion Mapping",
    });

    expect(
      buildSolutionUpdateMutation({
        input,
      }),
    ).toEqual({
      access_model: "free",
      coverage_label: "Global",
      offering_description:
        "Deploys autonomous sensing, anomaly scoring, and operator workflows to detect risk before corrosion escalates across subsea assets.",
      sector_id: "sector-energy",
      summary: "Autonomous mapping stack for early subsea corrosion detection.",
      title: "Subsea Corrosion Mapping",
    });

    expect(
      buildChallengeSolutionLinkInsertRows({
        challengeIds: ["challenge-1", "challenge-2"],
        linkedByUserId: "user-1",
        solutionId: "solution-1",
      }),
    ).toEqual([
      {
        challenge_id: "challenge-1",
        linked_by_user_id: "user-1",
        solution_id: "solution-1",
      },
      {
        challenge_id: "challenge-2",
        linked_by_user_id: "user-1",
        solution_id: "solution-1",
      },
    ]);
  });

  it("creates clean slugs and tracks completion progress for the solution editor", () => {
    expect(createSolutionSlug(" AI Corrosion Mapping for Offshore Assets! ")).toBe(
      "ai-corrosion-mapping-for-offshore-assets",
    );

    expect(
      calculateSolutionAuthoringCompletion(
        normalizeSolutionAuthoringInput({
          accessModel: "contact",
          coverageLabel: "",
          linkedChallengeIds: [],
          offeringDescription:
            "Deploys autonomous sensing, anomaly scoring, and operator workflows to detect risk before corrosion escalates across subsea assets.",
          sectorId: "sector-energy",
          solutionId: "",
          summary: "Autonomous mapping stack for early subsea corrosion detection.",
          title: "",
        }),
      ),
    ).toEqual({
      completed: 4,
      total: 5,
    });
  });
});
