import { describe, expect, it } from "vitest";

import {
  PAGE_SIZE,
  buildPublicSolutionsBrowseViewModel,
  normalizePublicSolutionsBrowseFilters,
} from "@/lib/data/public-solutions";

const sectors = [
  {
    description: "Energy production and field operations.",
    displayOrder: 1,
    iconKey: "oil-gas",
    id: "sector-oil",
    name: "Oil & Gas",
    slug: "oil-gas",
  },
  {
    description: "Hospital and care-delivery systems.",
    displayOrder: 4,
    iconKey: "healthcare",
    id: "sector-health",
    name: "Healthcare",
    slug: "healthcare",
  },
];

const sectorActivity = [
  {
    latestPublicationAt: "2026-04-06T08:00:00.000Z",
    publishedChallengeCount: 4,
    publishedSolutionCount: 3,
    sectorId: "sector-oil",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
  },
  {
    latestPublicationAt: "2026-04-05T08:00:00.000Z",
    publishedChallengeCount: 2,
    publishedSolutionCount: 1,
    sectorId: "sector-health",
    sectorName: "Healthcare",
    sectorSlug: "healthcare",
  },
];

const solutions = [
  {
    accessModel: "free" as const,
    companyId: "company-1",
    companyLogoPath: null,
    companyName: "TechSolutions UAE",
    companySlug: "techsolutions-uae",
    coverageLabel: "Global",
    id: "solution-1",
    linkedChallengeCount: 3,
    offeringDescription: "Autonomous underwater diagnostics with anomaly scoring.",
    publishedAt: "2026-04-06T09:00:00.000Z",
    sectorId: "sector-oil",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
    slug: "subsea-corrosion-mapping",
    status: "published" as const,
    summary: "Autonomous mapping stack for early subsea corrosion detection.",
    title: "Subsea Corrosion Mapping",
    voteCount: 47,
  },
  {
    accessModel: "contact" as const,
    companyId: "company-2",
    companyLogoPath: null,
    companyName: "MedTech Arabia",
    companySlug: "medtech-arabia",
    coverageLabel: "UAE",
    id: "solution-2",
    linkedChallengeCount: 1,
    offeringDescription: "FHIR middleware with consent-aware patient data exchange.",
    publishedAt: "2026-04-05T09:00:00.000Z",
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

describe("public solutions browse data", () => {
  it("normalizes search params into stable browse filters", () => {
    expect(
      normalizePublicSolutionsBrowseFilters({
        access: "free",
        page: ["3", "4"],
        q: "  pipeline, corrosion  ",
        sector: "oil-gas",
        sort: "votes",
      }),
    ).toEqual({
      accessModel: "free",
      page: 3,
      query: "pipeline corrosion",
      sectorSlug: "oil-gas",
      sort: "votes",
    });

    expect(
      normalizePublicSolutionsBrowseFilters({
        access: "invalid",
        page: "0",
        q: "   ",
        sector: "not-a-sector",
        sort: "invalid",
      }),
    ).toEqual({
      accessModel: null,
      page: 1,
      query: "",
      sectorSlug: null,
      sort: "latest",
    });
  });

  it("builds a live browse view model with cards, filters, and pagination", () => {
    const viewModel = buildPublicSolutionsBrowseViewModel({
      filters: {
        accessModel: "free",
        page: 2,
        query: "pipeline",
        sectorSlug: "oil-gas",
        sort: "votes",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        providerCount: 7,
        sectorActivity,
        sectors,
        solutions,
        totalCount: PAGE_SIZE + 1,
      },
      source: "live",
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.resultSummary).toContain(`Showing ${PAGE_SIZE + 1}-${PAGE_SIZE + 1} of ${PAGE_SIZE + 1}`);
    expect(viewModel.quickFilters[1]).toMatchObject({
      active: true,
      label: "Oil & Gas",
      resultCount: 3,
    });
    expect(viewModel.cards[0]).toMatchObject({
      href: "/solutions/subsea-corrosion-mapping",
      publicationLabel: "Free Solution",
      regionLabel: "Global · TechSolutions UAE",
      votes: 47,
    });
    expect(viewModel.pagination).toMatchObject({
      currentPage: 2,
      hasNextPage: false,
      hasPreviousPage: true,
      pageCount: 2,
    });
    expect(viewModel.pagination.previousHref).toBe(
      "/solutions?q=pipeline&sector=oil-gas&access=free&sort=votes",
    );
    expect(viewModel.stats[1]).toMatchObject({
      label: "Public Providers",
      value: "7",
    });
  });

  it("returns an empty state when no solutions match the active filters", () => {
    const viewModel = buildPublicSolutionsBrowseViewModel({
      filters: {
        accessModel: "paid",
        page: 1,
        query: "solar",
        sectorSlug: "healthcare",
        sort: "latest",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        providerCount: 7,
        sectorActivity,
        sectors,
        solutions: [],
        totalCount: 0,
      },
      source: "live",
    });

    expect(viewModel.state).toBe("empty");
    expect(viewModel.emptyMessage).toContain("No published solutions match");
    expect(viewModel.resultSummary).toContain("0 published solutions");
  });

  it("falls back to setup guidance while preserving governed sector filters", () => {
    const viewModel = buildPublicSolutionsBrowseViewModel({
      filters: {
        accessModel: null,
        page: 1,
        query: "",
        sectorSlug: null,
        sort: "latest",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        providerCount: 0,
        sectorActivity: [],
        sectors: [],
        solutions: [],
        totalCount: 0,
      },
      source: "setup",
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.sectorOptions).toHaveLength(13);
    expect(viewModel.supportingText).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });
});
