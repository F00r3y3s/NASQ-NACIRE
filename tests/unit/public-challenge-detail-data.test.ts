import { describe, expect, it } from "vitest";

import { buildPublicChallengeDetailViewModel } from "@/lib/data/public-challenge-detail";

const challenge = {
  anonymityMode: "anonymous" as const,
  companyLogoPath: null,
  companyName: "Anonymous",
  companySlug: null,
  desiredOutcome: "A unified response workflow across all emergency care touchpoints.",
  geographyLabel: "UAE",
  id: "challenge-1",
  linkedSolutionCount: 2,
  problemStatement:
    "Fragmented records across public and private networks create delays in emergency care.",
  publishedAt: "2026-04-06T08:00:00.000Z",
  sectorId: "sector-health",
  sectorName: "Healthcare",
  sectorSlug: "healthcare",
  slug: "hospital-interoperability",
  status: "published" as const,
  summary: "Fragmented records delay care and duplicate diagnostics.",
  title: "Hospital Interoperability",
};

const sector = {
  description: "Clinical, hospital, patient-data, and care-delivery challenges.",
  displayOrder: 4,
  iconKey: "healthcare",
  id: "sector-health",
  name: "Healthcare",
  slug: "healthcare",
};

const sectorActivity = {
  latestPublicationAt: "2026-04-06T08:00:00.000Z",
  publishedChallengeCount: 2,
  publishedSolutionCount: 3,
  sectorId: "sector-health",
  sectorName: "Healthcare",
  sectorSlug: "healthcare",
};

const linkedSolutions = [
  {
    accessModel: "free" as const,
    companyId: "company-1",
    companyLogoPath: null,
    companyName: "MedTech Arabia",
    companySlug: "medtech-arabia",
    coverageLabel: "UAE Market",
    id: "solution-1",
    linkedChallengeCount: 2,
    offeringDescription: "FHIR middleware with consent-aware patient data exchange.",
    publishedAt: "2026-04-06T09:00:00.000Z",
    sectorId: "sector-health",
    sectorName: "Healthcare",
    sectorSlug: "healthcare",
    slug: "fhir-exchange-platform",
    status: "published" as const,
    summary: "FHIR middleware with consent-aware patient data exchange.",
    title: "FHIR Exchange Platform",
    voteCount: 31,
  },
];

describe("public challenge detail data", () => {
  it("builds a live privacy-safe detail view model with linked solutions and sector context", () => {
    const viewModel = buildPublicChallengeDetailViewModel({
      challenge,
      linkedSolutions,
      sector,
      sectorActivity,
      source: "live",
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.id).toBe("challenge-1");
    expect(viewModel.isOpenChallenge).toBe(false);
    expect(viewModel.title).toBe("Hospital Interoperability");
    expect(viewModel.anonymityMode).toBe("anonymous");
    expect(viewModel.badges).toEqual([
      { label: "Public-safe Detail", tone: "green" },
      { label: "Anonymous Posting", tone: "blue" },
      { label: "2 Linked Solutions", tone: "teal" },
    ]);
    expect(viewModel.metadata.find((item) => item.label === "Identity")?.value).toBe("Anonymous");
    expect(viewModel.metadata.find((item) => item.label === "Status")?.value).toBe(
      "Matched Solutions",
    );
    expect(viewModel.sectorContext.metric).toBe("2 challenges · 3 solutions");
    expect(viewModel.linkedSolutionCards[0]).toMatchObject({
      href: "/solutions/fhir-exchange-platform",
      publicationLabel: "Free Solution",
      regionLabel: "UAE Market · MedTech Arabia",
    });
    expect(viewModel.responseGuidance[1]?.detail).toContain("relay");
  });

  it("shows a no-match guidance path when the challenge has no linked solutions yet", () => {
    const viewModel = buildPublicChallengeDetailViewModel({
      challenge: {
        ...challenge,
        anonymityMode: "named",
        companyName: "Cleveland Clinic Abu Dhabi",
        companySlug: "cleveland-clinic-abu-dhabi",
        linkedSolutionCount: 0,
      },
      linkedSolutions: [],
      sector,
      sectorActivity,
      source: "live",
    });

    expect(viewModel.badges[1]).toEqual({ label: "Named Company", tone: "gold" });
    expect(viewModel.anonymityMode).toBe("named");
    expect(viewModel.isOpenChallenge).toBe(true);
    expect(viewModel.badges[2]).toEqual({ label: "No Linked Solutions Yet", tone: "red" });
    expect(viewModel.emptySolutionsMessage).toContain("No linked public solutions");
    expect(viewModel.metadata.find((item) => item.label === "Identity")?.value).toBe(
      "Cleveland Clinic Abu Dhabi",
    );
  });

  it("returns setup guidance when Supabase is not configured yet", () => {
    const viewModel = buildPublicChallengeDetailViewModel({
      challenge: null,
      linkedSolutions: [],
      sector: null,
      sectorActivity: null,
      source: "setup",
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.anonymityMode).toBeNull();
    expect(viewModel.id).toBeNull();
    expect(viewModel.isOpenChallenge).toBe(false);
    expect(viewModel.title).toBe("Challenge Detail");
    expect(viewModel.summary).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });
});
