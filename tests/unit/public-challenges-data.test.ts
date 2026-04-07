import { describe, expect, it } from "vitest";

import {
  buildPublicChallengesBrowseViewModel,
  normalizePublicChallengesBrowseFilters,
  PAGE_SIZE,
} from "@/lib/data/public-challenges";

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
  {
    description: "Aviation operations and passenger systems.",
    displayOrder: 12,
    iconKey: "aviation",
    id: "sector-aviation",
    name: "Aviation",
    slug: "aviation",
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

const challenges = [
  {
    anonymityMode: "named" as const,
    companyLogoPath: null,
    companyName: "ADNOC Group",
    companySlug: "adnoc-group",
    geographyLabel: "Global",
    id: "challenge-1",
    linkedSolutionCount: 3,
    problemStatement: "Corrosion challenge.",
    publishedAt: "2026-04-06T08:00:00.000Z",
    sectorId: "sector-oil",
    sectorName: "Oil & Gas",
    sectorSlug: "oil-gas",
    slug: "pipeline-corrosion",
    status: "published" as const,
    summary: "Inspection costs are high in subsea environments.",
    title: "Pipeline Corrosion",
  },
  {
    anonymityMode: "anonymous" as const,
    companyLogoPath: null,
    companyName: "Anonymous",
    companySlug: null,
    geographyLabel: "UAE",
    id: "challenge-2",
    linkedSolutionCount: 0,
    problemStatement: "Interoperability challenge.",
    publishedAt: "2026-04-05T08:00:00.000Z",
    sectorId: "sector-health",
    sectorName: "Healthcare",
    sectorSlug: "healthcare",
    slug: "hospital-interoperability",
    status: "published" as const,
    summary: "Fragmented records delay care.",
    title: "Hospital Interoperability",
  },
];

describe("public challenges browse data", () => {
  it("normalizes search params into stable browse filters", () => {
    expect(
      normalizePublicChallengesBrowseFilters({
        page: ["3", "4"],
        q: "  pipeline, corrosion  ",
        sector: "oil-gas",
        sort: "matches",
        status: "open",
      }),
    ).toEqual({
      page: 3,
      query: "pipeline corrosion",
      sectorSlug: "oil-gas",
      sort: "matches",
      status: "open",
    });

    expect(
      normalizePublicChallengesBrowseFilters({
        page: "0",
        q: "   ",
        sector: "not-a-sector",
        sort: "invalid",
        status: "invalid",
      }),
    ).toEqual({
      page: 1,
      query: "",
      sectorSlug: null,
      sort: "latest",
      status: "all",
    });
  });

  it("builds a live browse view model with active filters, cards, and pagination", () => {
    const viewModel = buildPublicChallengesBrowseViewModel({
      filters: {
        page: 2,
        query: "pipeline",
        sectorSlug: "oil-gas",
        sort: "matches",
        status: "solved",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        challenges,
        sectorActivity,
        sectors,
        totalCount: PAGE_SIZE + 1,
      },
      source: "live",
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.resultSummary).toContain(`Showing ${PAGE_SIZE + 1}-${PAGE_SIZE + 1} of ${PAGE_SIZE + 1}`);
    expect(viewModel.quickFilters[1]).toMatchObject({
      active: true,
      label: "Oil & Gas",
      resultCount: 4,
    });
    expect(viewModel.statusOptions).toEqual([
      { active: false, label: "All Challenges", value: "all" },
      { active: false, label: "Open Only", value: "open" },
      { active: true, label: "Solved Only", value: "solved" },
    ]);
    expect(viewModel.cards[0]).toMatchObject({
      companyLabel: "ADNOC Group",
      href: "/challenges/pipeline-corrosion",
      statusLabel: "Solved",
    });
    expect(viewModel.cards[1]).toMatchObject({
      anonymous: true,
      href: "/challenges/hospital-interoperability",
      statusLabel: "Open",
    });
    expect(viewModel.pagination).toMatchObject({
      currentPage: 2,
      hasNextPage: false,
      hasPreviousPage: true,
      pageCount: 2,
    });
    expect(viewModel.pagination.previousHref).toBe(
      "/challenges?q=pipeline&sector=oil-gas&sort=matches&status=solved",
    );
    expect(viewModel.stats[1]).toMatchObject({
      label: "Governed Sectors",
      value: "3",
    });
    expect(viewModel.stats[2]).toMatchObject({
      label: "Challenge Status",
      value: "Solved Only",
    });
  });

  it("returns an empty state message when no published challenges match the active filters", () => {
    const viewModel = buildPublicChallengesBrowseViewModel({
      filters: {
        page: 1,
        query: "solar",
        sectorSlug: "aviation",
        sort: "latest",
        status: "open",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        challenges: [],
        sectorActivity,
        sectors,
        totalCount: 0,
      },
      source: "live",
    });

    expect(viewModel.state).toBe("empty");
    expect(viewModel.emptyMessage).toContain("No published challenges match");
    expect(viewModel.resultSummary).toContain("0 published challenges");
  });

  it("falls back to setup guidance while preserving governed sector options", () => {
    const viewModel = buildPublicChallengesBrowseViewModel({
      filters: {
        page: 1,
        query: "",
        sectorSlug: null,
        sort: "latest",
        status: "all",
      },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        challenges: [],
        sectorActivity: [],
        sectors: [],
        totalCount: 0,
      },
      source: "setup",
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.sectorOptions).toHaveLength(13);
    expect(viewModel.supportingText).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });
});
