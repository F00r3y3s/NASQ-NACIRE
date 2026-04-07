import { describe, expect, it } from "vitest";

import { buildPublicSolutionDetailViewModel } from "@/lib/data/public-solution-detail";

const solution = {
  accessModel: "paid" as const,
  companyId: "company-1",
  companyLogoPath: null,
  companyName: "TechSolutions UAE",
  companySlug: "techsolutions-uae",
  coverageLabel: "Global",
  id: "solution-1",
  linkedChallengeCount: 2,
  offeringDescription:
    "Deploys autonomous underwater diagnostics, anomaly scoring, and operator workflows for early subsea corrosion response.",
  publishedAt: "2026-04-06T09:00:00.000Z",
  sectorId: "sector-oil",
  sectorName: "Oil & Gas",
  sectorSlug: "oil-gas",
  slug: "subsea-corrosion-mapping",
  status: "published" as const,
  summary: "Autonomous mapping stack for early subsea corrosion detection.",
  title: "Subsea Corrosion Mapping",
  voteCount: 47,
};

const provider = {
  city: "Abu Dhabi",
  countryCode: "AE",
  description: "Industrial diagnostics and field-operations technology provider.",
  headquartersLabel: "Abu Dhabi, UAE",
  id: "company-1",
  logoPath: null,
  name: "TechSolutions UAE",
  publishedChallengeCount: 1,
  publishedSolutionCount: 3,
  slug: "techsolutions-uae",
  websiteUrl: "https://techsolutions.example",
};

const sector = {
  description: "Energy production and field operations.",
  displayOrder: 1,
  iconKey: "oil-gas",
  id: "sector-oil",
  name: "Oil & Gas",
  slug: "oil-gas",
};

const sectorActivity = {
  latestPublicationAt: "2026-04-06T08:00:00.000Z",
  publishedChallengeCount: 4,
  publishedSolutionCount: 3,
  sectorId: "sector-oil",
  sectorName: "Oil & Gas",
  sectorSlug: "oil-gas",
};

const linkedChallenges = [
  {
    anonymityMode: "named" as const,
    companyLogoPath: null,
    companyName: "ADNOC Group",
    companySlug: "adnoc-group",
    geographyLabel: "Global",
    id: "challenge-1",
    linkedSolutionCount: 3,
    problemStatement: "Pipeline corrosion challenge.",
    publishedAt: "2026-04-05T08:00:00.000Z",
    sectorId: "sector-oil",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
    slug: "pipeline-corrosion",
    status: "published" as const,
    summary: "Inspection costs are high in subsea environments.",
    title: "Pipeline Corrosion",
  },
];

describe("public solution detail data", () => {
  it("builds a live detail view model with provider context and linked challenges", () => {
    const viewModel = buildPublicSolutionDetailViewModel({
      linkedChallenges,
      provider,
      sector,
      sectorActivity,
      solution,
      source: "live",
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.title).toBe("Subsea Corrosion Mapping");
    expect(viewModel.badges).toEqual([
      { label: "Public Solution", tone: "green" },
      { label: "Paid Solution", tone: "gold" },
      { label: "2 Linked Challenges", tone: "teal" },
    ]);
    expect(viewModel.metadata.find((item) => item.label === "Provider")?.value).toBe(
      "TechSolutions UAE",
    );
    expect(viewModel.providerProfile?.websiteUrl).toBe("https://techsolutions.example");
    expect(viewModel.linkedChallengeCards[0]).toMatchObject({
      companyLabel: "ADNOC Group",
      href: "/challenges/pipeline-corrosion",
      statusLabel: "Matched",
    });
    expect(viewModel.sectorContext.metric).toBe("4 challenges · 3 solutions");
  });

  it("shows a standalone guidance path when no linked challenges exist", () => {
    const viewModel = buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider,
      sector,
      sectorActivity,
      solution: {
        ...solution,
        accessModel: "contact",
        linkedChallengeCount: 0,
      },
      source: "live",
    });

    expect(viewModel.badges[1]).toEqual({ label: "Contact Provider", tone: "blue" });
    expect(viewModel.badges[2]).toEqual({ label: "Standalone Record", tone: "gold" });
    expect(viewModel.emptyChallengesMessage).toContain("not linked to public challenges");
  });

  it("returns an honest error state when the core solution loads but supporting context fails", () => {
    const viewModel = buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider: null,
      sector,
      sectorActivity: null,
      solution,
      source: "error",
    });

    expect(viewModel.state).toBe("error");
    expect(viewModel.title).toBe("Subsea Corrosion Mapping");
    expect(viewModel.badges).toContainEqual({ label: "Query Error", tone: "red" });
    expect(viewModel.metadata.find((item) => item.label === "Provider")?.value).toBe(
      "TechSolutions UAE",
    );
    expect(viewModel.summary).toContain("core solution record loaded");
    expect(viewModel.emptyChallengesMessage).toContain("could not be verified");
  });

  it("returns an error fallback when the solution detail query fails before the record loads", () => {
    const viewModel = buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider: null,
      sector: null,
      sectorActivity: null,
      solution: null,
      source: "error",
    });

    expect(viewModel.state).toBe("error");
    expect(viewModel.title).toBe("Solution Detail");
    expect(viewModel.badges).toEqual([
      { label: "Public Solution", tone: "green" },
      { label: "Query Error", tone: "red" },
    ]);
    expect(viewModel.summary).toContain("could not be verified");
  });

  it("returns setup guidance when Supabase is not configured yet", () => {
    const viewModel = buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider: null,
      sector: null,
      sectorActivity: null,
      solution: null,
      source: "setup",
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.title).toBe("Solution Detail");
    expect(viewModel.summary).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });
});
