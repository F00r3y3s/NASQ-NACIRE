import { describe, expect, it } from "vitest";

import {
  createEmptyCompanyGovernanceInput,
  createEmptySectorGovernanceInput,
  getCompanyGovernanceStatusMessage,
  getLinkOversightStatusMessage,
  getModerationStatusMessage,
  getSectorGovernanceStatusMessage,
  validateChallengeModerationInput,
  validateCompanyGovernanceInput,
  validateLinkCreationInput,
  validateSectorGovernanceInput,
  validateSolutionModerationInput,
} from "@/lib/admin/governance";
import {
  buildAdminCompaniesViewModel,
  buildAdminLinksViewModel,
  buildAdminModerationViewModel,
  buildAdminSectorsViewModel,
} from "@/lib/data/admin-governance";

describe("admin governance", () => {
  it("requires review notes when a challenge is rejected or archived", () => {
    expect(
      validateChallengeModerationInput({
        challengeId: "challenge-1",
        reviewNotes: "  ",
        status: "rejected",
      }).fieldErrors.reviewNotes,
    ).toContain("required");

    expect(
      validateChallengeModerationInput({
        challengeId: "challenge-1",
        reviewNotes: "Ready for public release.",
        status: "published",
      }).fieldErrors,
    ).toEqual({});
  });

  it("requires review notes when a solution is hidden or archived", () => {
    expect(
      validateSolutionModerationInput({
        reviewNotes: "",
        solutionId: "solution-1",
        status: "hidden",
      }).fieldErrors.reviewNotes,
    ).toContain("required");

    expect(
      validateSolutionModerationInput({
        reviewNotes: "Investigating a provider trust issue.",
        solutionId: "solution-1",
        status: "under_review",
      }).fieldErrors,
    ).toEqual({});
  });

  it("validates governed sector input for slug, name, and description", () => {
    expect(
      validateSectorGovernanceInput({
        ...createEmptySectorGovernanceInput(),
        description: "short",
        displayOrder: "4",
        name: "A",
        slug: "Invalid Slug",
      }).fieldErrors,
    ).toMatchObject({
      description: expect.any(String),
      name: expect.any(String),
      slug: expect.any(String),
    });
  });

  it("validates company governance input for website and country code", () => {
    expect(
      validateCompanyGovernanceInput({
        ...createEmptyCompanyGovernanceInput(),
        countryCode: "uae",
        name: "ADNOC Group",
        slug: "adnoc-group",
        websiteUrl: "example.com",
      }).fieldErrors,
    ).toMatchObject({
      countryCode: expect.any(String),
      websiteUrl: expect.any(String),
    });
  });

  it("validates link creation input requires both records", () => {
    expect(
      validateLinkCreationInput({
        challengeId: "",
        solutionId: "",
      }).fieldErrors,
    ).toMatchObject({
      challengeId: expect.any(String),
      solutionId: expect.any(String),
    });
  });

  it("builds the moderation view model with selected records and audit feed", () => {
    const viewModel = buildAdminModerationViewModel({
      selectedChallengeId: "challenge-1",
      selectedSolutionId: "solution-2",
      snapshot: {
        challenges: [
          {
            anonymityMode: "anonymous",
            companyName: "Anonymous",
            id: "challenge-1",
            reviewNotes: null,
            reviewedAt: null,
            sectorName: "Healthcare",
            status: "pending_review",
            title: "Hospital Interoperability",
            updatedAt: "2026-04-06T08:00:00.000Z",
          },
        ],
        events: [
          {
            actionLabel: "Challenge approved",
            actorLabel: "Admin",
            occurredAt: "2026-04-06T10:00:00.000Z",
            targetLabel: "Hospital Interoperability",
          },
        ],
        solutions: [
          {
            companyName: "ADNOC Group",
            id: "solution-2",
            reviewNotes: "Need stronger evidence.",
            reviewedAt: "2026-04-05T10:00:00.000Z",
            sectorName: "Oil & Gas",
            status: "under_review",
            title: "Subsea Corrosion Mapping",
            updatedAt: "2026-04-05T08:00:00.000Z",
          },
        ],
        state: "live",
        statusMessage: getModerationStatusMessage("challenge-reviewed"),
      },
    });

    expect(viewModel.badges.map((badge) => badge.label)).toEqual([
      "Protected Admin",
      "1 Pending Challenges",
      "1 Flagged Solutions",
    ]);
    expect(viewModel.selectedChallenge?.title).toBe("Hospital Interoperability");
    expect(viewModel.selectedSolution?.statusLabel).toBe("Under Review");
    expect(viewModel.recentEvents[0]?.text).toContain("Challenge approved");
  });

  it("builds the sectors view model with visible and hidden counts", () => {
    const viewModel = buildAdminSectorsViewModel({
      selectedSectorId: "sector-2",
      snapshot: {
        sectors: [
          {
            challengeCount: 4,
            description: "Exploration and refinery operations.",
            displayOrder: 1,
            iconKey: "oil-gas",
            id: "sector-1",
            isVisible: true,
            name: "Oil & Gas",
            slug: "oil-gas",
            solutionCount: 3,
          },
          {
            challengeCount: 1,
            description: "Police operations and emergency readiness.",
            displayOrder: 11,
            iconKey: "police-civil-defense",
            id: "sector-2",
            isVisible: false,
            name: "Police & Civil Defense",
            slug: "police-civil-defense",
            solutionCount: 0,
          },
        ],
        state: "live",
        statusMessage: getSectorGovernanceStatusMessage("sector-updated"),
      },
    });

    expect(viewModel.badges.map((badge) => badge.label)).toEqual([
      "1 Visible",
      "1 Hidden",
      "2 Governed Sectors",
    ]);
    expect(viewModel.selectedSector?.name).toBe("Police & Civil Defense");
    expect(viewModel.selectedSector?.visibilityLabel).toBe("Hidden from public discovery");
  });

  it("builds the companies view model with trust rollups and selected members", () => {
    const viewModel = buildAdminCompaniesViewModel({
      selectedCompanyId: "company-1",
      snapshot: {
        companies: [
          {
            city: "Abu Dhabi",
            countryCode: "AE",
            description: "Energy operator.",
            headquartersLabel: "Abu Dhabi, UAE",
            id: "company-1",
            isPublic: true,
            membershipCount: 2,
            name: "ADNOC Group",
            pendingMembershipCount: 1,
            publishedChallengeCount: 3,
            publishedSolutionCount: 2,
            slug: "adnoc-group",
            verifiedMembershipCount: 1,
            websiteUrl: "https://adnoc.example",
          },
          {
            city: "Riyadh",
            countryCode: "SA",
            description: "Regional lab.",
            headquartersLabel: "Other MENA",
            id: "company-2",
            isPublic: false,
            membershipCount: 1,
            name: "Regional Labs",
            pendingMembershipCount: 0,
            publishedChallengeCount: 0,
            publishedSolutionCount: 0,
            slug: "regional-labs",
            verifiedMembershipCount: 1,
            websiteUrl: null,
          },
        ],
        membershipsByCompanyId: new Map([
          [
            "company-1",
            [
              {
                email: "admin@adnoc.example",
                id: "membership-1",
                isPrimary: true,
                role: "company_admin",
                userLabel: "Aisha Malik",
                verificationStatus: "verified",
              },
              {
                email: "member@adnoc.example",
                id: "membership-2",
                isPrimary: false,
                role: "member",
                userLabel: "Omar Hassan",
                verificationStatus: "pending",
              },
            ],
          ],
        ]),
        state: "live",
        statusMessage: getCompanyGovernanceStatusMessage("membership-updated"),
      },
    });

    expect(viewModel.badges.map((badge) => badge.label)).toEqual([
      "1 Public Companies",
      "1 Private Companies",
      "1 Pending Memberships",
    ]);
    expect(viewModel.selectedCompany?.members[0]).toMatchObject({
      userLabel: "Aisha Malik",
      verificationLabel: "Verified",
    });
    expect(viewModel.selectedCompany?.trustSummary).toContain("3 published challenges");
  });

  it("builds the links view model with link candidates and selected link", () => {
    const viewModel = buildAdminLinksViewModel({
      selectedLinkId: "link-1",
      snapshot: {
        candidates: {
          challenges: [
            {
              id: "challenge-1",
              label: "Pipeline Corrosion",
            },
          ],
          solutions: [
            {
              id: "solution-1",
              label: "Subsea Corrosion Mapping",
            },
          ],
        },
        links: [
          {
            challengeId: "challenge-1",
            challengeLabel: "Pipeline Corrosion",
            createdAt: "2026-04-06T09:00:00.000Z",
            id: "link-1",
            linkedByLabel: "Admin",
            solutionId: "solution-1",
            solutionLabel: "Subsea Corrosion Mapping",
          },
        ],
        state: "live",
        statusMessage: getLinkOversightStatusMessage("link-created"),
      },
    });

    expect(viewModel.badges.map((badge) => badge.label)).toEqual([
      "1 Active Links",
      "1 Challenge Candidates",
      "1 Solution Candidates",
    ]);
    expect(viewModel.selectedLink?.challengeLabel).toBe("Pipeline Corrosion");
    expect(viewModel.createHint).toContain("published challenge");
  });
});
