import { describe, expect, it } from "vitest";

import {
  buildChallengeDraftMutation,
  buildChallengeInsertMutation,
  calculateChallengeSubmissionCompletion,
  createChallengeSlug,
  normalizeChallengeSubmissionInput,
  validateChallengeSubmission,
} from "@/lib/challenges/submission";

describe("challenge submission helpers", () => {
  it("normalizes raw form values into stable submission input", () => {
    expect(
      normalizeChallengeSubmissionInput({
        anonymityMode: "anonymous",
        desiredOutcome: "  Reduce emergency response time by 30%.  ",
        draftId: " draft-1 ",
        geographyLabel: "  UAE + GCC  ",
        problemStatement: "  Fragmented records delay care.  ",
        sectorId: " sector-1 ",
        sourceConversationId: " convo-1 ",
        summary: "  Cross-network patient records remain fragmented. ",
        title: "  Hospital Interoperability  ",
      }),
    ).toEqual({
      anonymityMode: "anonymous",
      desiredOutcome: "Reduce emergency response time by 30%.",
      draftId: "draft-1",
      geographyLabel: "UAE + GCC",
      problemStatement: "Fragmented records delay care.",
      sectorId: "sector-1",
      sourceConversationId: "convo-1",
      summary: "Cross-network patient records remain fragmented.",
      title: "Hospital Interoperability",
    });
  });

  it("rejects an empty draft save and requires the core fields on submit", () => {
    expect(
      validateChallengeSubmission(
        {
          anonymityMode: "named",
          desiredOutcome: "",
          draftId: "",
          geographyLabel: "",
          problemStatement: "",
          sectorId: "",
          sourceConversationId: "",
          summary: "",
          title: "",
        },
        "save_draft",
      ),
    ).toMatchObject({
      formError: "Add at least one field before saving a draft.",
    });

    expect(
      validateChallengeSubmission(
        {
          anonymityMode: "named",
          desiredOutcome: "",
          draftId: "",
          geographyLabel: "",
          problemStatement: "Too short",
          sectorId: "",
          sourceConversationId: "",
          summary: "Short",
          title: "Test",
        },
        "submit_for_review",
      ),
    ).toEqual({
      fieldErrors: {
        geographyLabel: "Select a geography scope.",
        problemStatement: "Provide a detailed problem statement with at least 40 characters.",
        sectorId: "Select a governed sector.",
        summary: "Write a summary with at least 24 characters.",
        title: "Use a challenge title with at least 8 characters.",
      },
      formError: "Complete the required fields before submitting for review.",
    });
  });

  it("builds draft and challenge mutation payloads from validated input", () => {
    const input = normalizeChallengeSubmissionInput({
      anonymityMode: "anonymous",
      desiredOutcome: "Reduce patient handoff delays.",
      draftId: "draft-1",
      geographyLabel: "UAE",
      problemStatement:
        "Emergency department records do not synchronize across provider networks, which creates treatment delays.",
      sectorId: "sector-health",
      sourceConversationId: "conversation-1",
      summary: "Patient records remain fragmented across hospital systems.",
      title: "Hospital Interoperability",
    });

    expect(
      buildChallengeDraftMutation({
        input,
        ownerMembershipId: "membership-1",
        status: "draft",
      }),
    ).toEqual({
      anonymity_mode: "anonymous",
      desired_outcome: "Reduce patient handoff delays.",
      geography_label: "UAE",
      owner_membership_id: "membership-1",
      problem_statement:
        "Emergency department records do not synchronize across provider networks, which creates treatment delays.",
      sector_id: "sector-health",
      source_conversation_id: "conversation-1",
      status: "draft",
      submitted_challenge_id: null,
      summary: "Patient records remain fragmented across hospital systems.",
      title: "Hospital Interoperability",
    });

    expect(
      buildChallengeInsertMutation({
        companyId: "company-1",
        input,
        ownerMembershipId: "membership-1",
        slug: "hospital-interoperability",
      }),
    ).toEqual({
      anonymity_mode: "anonymous",
      company_id: "company-1",
      desired_outcome: "Reduce patient handoff delays.",
      geography_label: "UAE",
      owner_membership_id: "membership-1",
      problem_statement:
        "Emergency department records do not synchronize across provider networks, which creates treatment delays.",
      sector_id: "sector-health",
      slug: "hospital-interoperability",
      status: "pending_review",
      summary: "Patient records remain fragmented across hospital systems.",
      title: "Hospital Interoperability",
    });
  });

  it("creates clean slugs and tracks completion progress for editor sidebars", () => {
    expect(createChallengeSlug(" Pipeline Corrosion Detection in Subsea Environments! ")).toBe(
      "pipeline-corrosion-detection-in-subsea-environments",
    );

    expect(
      calculateChallengeSubmissionCompletion(
        normalizeChallengeSubmissionInput({
          anonymityMode: "named",
          desiredOutcome: "",
          draftId: "",
          geographyLabel: "UAE",
          problemStatement:
            "Emergency department records do not synchronize across provider networks, which creates treatment delays.",
          sectorId: "sector-health",
          sourceConversationId: "",
          summary: "Patient records remain fragmented across hospital systems.",
          title: "",
        }),
      ),
    ).toEqual({
      completed: 4,
      total: 5,
    });
  });
});
