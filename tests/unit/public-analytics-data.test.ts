import { describe, expect, it } from "vitest";

import {
  buildPublicAnalyticsViewModel,
  resolvePublicAnalyticsFilters,
} from "@/lib/data/public-analytics";

const liveSnapshot = {
  challenges: [
    {
      anonymityMode: "named" as const,
      companyLogoPath: null,
      companyName: "ADNOC Group",
      companySlug: "adnoc-group",
      geographyLabel: "UAE",
      id: "challenge-1",
      linkedSolutionCount: 2,
      problemStatement: "Pipeline corrosion challenge",
      publishedAt: "2026-04-01T08:00:00.000Z",
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
      geographyLabel: "Saudi Arabia",
      id: "challenge-2",
      linkedSolutionCount: 0,
      problemStatement: "Interoperability challenge",
      publishedAt: "2026-04-03T08:00:00.000Z",
      sectorId: "sector-health",
      sectorName: "Healthcare",
      sectorSlug: "healthcare",
      slug: "hospital-interoperability",
      status: "published" as const,
      summary: "Fragmented records delay care.",
      title: "Hospital Interoperability",
    },
    {
      anonymityMode: "named" as const,
      companyLogoPath: null,
      companyName: "Etihad Airways",
      companySlug: "etihad-airways",
      geographyLabel: "Qatar",
      id: "challenge-3",
      linkedSolutionCount: 1,
      problemStatement: "Turnaround timing challenge",
      publishedAt: "2026-04-05T08:00:00.000Z",
      sectorId: "sector-aviation",
      sectorName: "Aviation",
      sectorSlug: "aviation",
      slug: "turnaround-efficiency",
      status: "published" as const,
      summary: "Gate turnaround needs tighter coordination.",
      title: "Turnaround Efficiency",
    },
  ],
  companies: [
    {
      city: "Abu Dhabi",
      countryCode: "AE",
      description: null,
      headquartersLabel: "Abu Dhabi, UAE",
      id: "company-1",
      logoPath: null,
      name: "ADNOC Group",
      publishedChallengeCount: 3,
      publishedSolutionCount: 2,
      slug: "adnoc-group",
      websiteUrl: null,
    },
    {
      city: "Riyadh",
      countryCode: "SA",
      description: null,
      headquartersLabel: "Riyadh, Saudi Arabia",
      id: "company-2",
      logoPath: null,
      name: "Saudi Digital",
      publishedChallengeCount: 1,
      publishedSolutionCount: 1,
      slug: "saudi-digital",
      websiteUrl: null,
    },
    {
      city: "Doha",
      countryCode: "QA",
      description: null,
      headquartersLabel: "Doha, Qatar",
      id: "company-3",
      logoPath: null,
      name: "Qatar Motion",
      publishedChallengeCount: 0,
      publishedSolutionCount: 2,
      slug: "qatar-motion",
      websiteUrl: null,
    },
    {
      city: null,
      countryCode: null,
      description: null,
      headquartersLabel: "Other MENA",
      id: "company-4",
      logoPath: null,
      name: "Regional Labs",
      publishedChallengeCount: 1,
      publishedSolutionCount: 0,
      slug: "regional-labs",
      websiteUrl: null,
    },
  ],
  metrics: {
    latestActivityAt: "2026-04-06T10:00:00.000Z",
    publicCompanyCount: 9,
    publicSignalCount: 14,
    publishedChallengeCount: 10,
    publishedSolutionCount: 8,
    visibleSectorCount: 13,
  },
  sectorActivity: [
    {
      latestPublicationAt: "2026-04-05T08:00:00.000Z",
      publishedChallengeCount: 4,
      publishedSolutionCount: 3,
      sectorId: "sector-oil",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
    },
    {
      latestPublicationAt: "2026-04-03T08:00:00.000Z",
      publishedChallengeCount: 2,
      publishedSolutionCount: 1,
      sectorId: "sector-health",
      sectorName: "Healthcare",
      sectorSlug: "healthcare",
    },
    {
      latestPublicationAt: "2026-04-05T08:00:00.000Z",
      publishedChallengeCount: 1,
      publishedSolutionCount: 1,
      sectorId: "sector-aviation",
      sectorName: "Aviation",
      sectorSlug: "aviation",
    },
  ],
  signals: [
    {
      actorLabel: "Member",
      eventName: "solution_published",
      id: "signal-1",
      occurredAt: "2026-04-06T10:00:00.000Z",
      resourceKind: "solution",
      resourceLabel: "Subsea Corrosion Mapping",
      route: "/solutions/subsea-corrosion-mapping",
      sectorName: "Oil & Gas",
    },
    {
      actorLabel: "Anonymous",
      eventName: "challenge_published",
      id: "signal-2",
      occurredAt: "2026-04-05T10:00:00.000Z",
      resourceKind: "challenge",
      resourceLabel: "Hospital Interoperability",
      route: "/challenges/hospital-interoperability",
      sectorName: "Healthcare",
    },
    {
      actorLabel: "Platform",
      eventName: "ai_discovery",
      id: "signal-3",
      occurredAt: "2026-04-04T10:00:00.000Z",
      resourceKind: "platform",
      resourceLabel: "Scenario Discovery",
      route: "/ai",
      sectorName: "Finance & Banking",
    },
    {
      actorLabel: "Member",
      eventName: "solution_published",
      id: "signal-4",
      occurredAt: "2026-04-02T10:00:00.000Z",
      resourceKind: "solution",
      resourceLabel: "Gate Turnaround Assistant",
      route: "/solutions/gate-turnaround-assistant",
      sectorName: "Aviation",
    },
  ],
  solutions: [
    {
      accessModel: "free" as const,
      companyId: "company-1",
      companyLogoPath: null,
      companyName: "ADNOC Group",
      companySlug: "adnoc-group",
      coverageLabel: "UAE",
      id: "solution-1",
      linkedChallengeCount: 2,
      offeringDescription: "Autonomous underwater diagnostics.",
      publishedAt: "2026-04-02T09:00:00.000Z",
      sectorId: "sector-oil",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
      slug: "subsea-corrosion-mapping",
      status: "published" as const,
      summary: "Autonomous underwater diagnostics.",
      title: "Subsea Corrosion Mapping",
      voteCount: 47,
    },
    {
      accessModel: "contact" as const,
      companyId: "company-2",
      companyLogoPath: null,
      companyName: "Saudi Digital",
      companySlug: "saudi-digital",
      coverageLabel: "Saudi Arabia",
      id: "solution-2",
      linkedChallengeCount: 1,
      offeringDescription: "Record-linking middleware.",
      publishedAt: "2026-04-04T09:00:00.000Z",
      sectorId: "sector-health",
      sectorName: "Healthcare",
      sectorSlug: "healthcare",
      slug: "record-linking-middleware",
      status: "published" as const,
      summary: "Record-linking middleware.",
      title: "Record Linking Middleware",
      voteCount: 18,
    },
    {
      accessModel: "paid" as const,
      companyId: "company-3",
      companyLogoPath: null,
      companyName: "Qatar Motion",
      companySlug: "qatar-motion",
      coverageLabel: "Qatar",
      id: "solution-3",
      linkedChallengeCount: 1,
      offeringDescription: "Ground crew orchestration tooling.",
      publishedAt: "2026-04-06T09:00:00.000Z",
      sectorId: "sector-aviation",
      sectorName: "Aviation",
      sectorSlug: "aviation",
      slug: "gate-turnaround-assistant",
      status: "published" as const,
      summary: "Ground crew orchestration tooling.",
      title: "Gate Turnaround Assistant",
      voteCount: 12,
    },
  ],
};

describe("public analytics data", () => {
  it("defaults to a 7-day range when search params are missing or invalid", () => {
    expect(resolvePublicAnalyticsFilters({})).toEqual({ range: "7d" });
    expect(resolvePublicAnalyticsFilters({ range: "90d" })).toEqual({ range: "7d" });
    expect(resolvePublicAnalyticsFilters({ range: ["30d", "7d"] })).toEqual({ range: "30d" });
  });

  it("builds a live analytics view model from public-safe records", () => {
    const viewModel = buildPublicAnalyticsViewModel({
      filters: { range: "7d" },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: liveSnapshot,
      source: "live",
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.badges.map((badge) => badge.label)).toEqual([
      "Public Intelligence",
      "7-Day Window",
      "13 Governed Sectors",
    ]);
    expect(viewModel.alertChips.map((chip) => `${chip.value} ${chip.label}`)).toEqual([
      "10 Open Problems",
      "1 Errors Today",
      "2 Resolved This Week",
      "3 New Solutions",
    ]);
    expect(viewModel.sparkCards.map((card) => card.label)).toEqual([
      "Active Companies",
      "Platform Events (30d)",
      "New Users (7d)",
    ]);
    expect(viewModel.goalCard).toMatchObject({
      activeTrackingCount: "3",
      progressPercent: 28,
      total: "5",
    });
    expect(viewModel.liveUsersCard.regions).toHaveLength(3);
    expect(viewModel.sectorDonut.segments[0]).toMatchObject({
      label: "Oil & Gas",
      total: "7",
    });
    expect(viewModel.statCards.map((card) => card.value)).toEqual(["9", "4", "3", "3"]);
    expect(viewModel.trend.points).toHaveLength(7);
    expect(viewModel.trend.summary.map((item) => item.value)).toEqual(["3", "3", "4"]);
    expect(viewModel.weeklySessionsCard.completionRate).toBe("50.0%");
    expect(viewModel.sectorRows[0]).toMatchObject({
      challengeCount: "4 challenges",
      label: "Oil & Gas",
      solutionCount: "3 solutions",
      total: "7",
    });
    expect(viewModel.geographyRows.map((row) => row.label)).toEqual([
      "🇦🇪 UAE",
      "🇸🇦 Saudi Arabia",
      "🇶🇦 Qatar",
      "🌍 Other MENA",
    ]);
    expect(viewModel.signalMixRows[0]).toMatchObject({
      label: "Solutions Posted",
      total: "2",
    });
    expect(viewModel.trafficSources.map((row) => row.label)).toEqual([
      "Direct",
      "Organic",
      "Social",
      "Internal",
      "Referral",
    ]);
    expect(viewModel.recentSignals[0]).toMatchObject({
      href: "/solutions/subsea-corrosion-mapping",
      icon: "✓",
      text: "Solution posted — Subsea Corrosion Mapping",
    });
    expect(viewModel.supportingText).toContain("last 7 days");
  });

  it("returns a setup state when Supabase is not configured yet", () => {
    const viewModel = buildPublicAnalyticsViewModel({
      filters: { range: "30d" },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        challenges: [],
        companies: [],
        metrics: null,
        sectorActivity: [],
        signals: [],
        solutions: [],
      },
      source: "setup",
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.alertChips.every((chip) => chip.value === "0")).toBe(true);
    expect(viewModel.sparkCards.every((card) => card.value === "0")).toBe(true);
    expect(viewModel.statCards.every((card) => card.value === "0")).toBe(true);
    expect(viewModel.supportingText).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });

  it("returns an empty state when the analytics query path is live but there are no public records", () => {
    const viewModel = buildPublicAnalyticsViewModel({
      filters: { range: "30d" },
      generatedAt: "2026-04-06T12:00:00.000Z",
      snapshot: {
        challenges: [],
        companies: [],
        metrics: {
          latestActivityAt: null,
          publicCompanyCount: 0,
          publicSignalCount: 0,
          publishedChallengeCount: 0,
          publishedSolutionCount: 0,
          visibleSectorCount: 13,
        },
        sectorActivity: [],
        signals: [],
        solutions: [],
      },
      source: "live",
    });

    expect(viewModel.state).toBe("empty");
    expect(viewModel.trafficSources).toEqual([]);
    expect(viewModel.trend.summary.every((item) => item.value === "0")).toBe(true);
    expect(viewModel.recentSignals).toEqual([]);
    expect(viewModel.emptyMessage).toContain("first public-safe records");
  });
});
