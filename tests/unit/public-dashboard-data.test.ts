import { describe, expect, it } from "vitest";

import { buildPublicDashboardViewModel } from "@/lib/data/public-dashboard";

const liveSnapshot = {
  activitySignals: [
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
  ],
  challenges: [
    {
      anonymityMode: "anonymous" as const,
      companyLogoPath: null,
      companyName: "Anonymous",
      companySlug: null,
      geographyLabel: "UAE",
      id: "challenge-1",
      linkedSolutionCount: 0,
      problemStatement: "Hidden owner problem statement",
      publishedAt: "2026-04-06T08:00:00.000Z",
      sectorId: "sector-healthcare",
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
      companyName: "ADNOC Group",
      companySlug: "adnoc-group",
      geographyLabel: "Global",
      id: "challenge-2",
      linkedSolutionCount: 3,
      problemStatement: "Pipeline corrosion challenge",
      publishedAt: "2026-04-05T08:00:00.000Z",
      sectorId: "sector-oil",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
      slug: "pipeline-corrosion",
      status: "published" as const,
      summary: "Inspection costs are high in subsea environments.",
      title: "Pipeline Corrosion",
    },
  ],
  metrics: {
    latestActivityAt: "2026-04-06T10:00:00.000Z",
    publicCompanyCount: 12,
    publicSignalCount: 6,
    publishedChallengeCount: 7,
    publishedSolutionCount: 5,
    visibleSectorCount: 13,
  },
  sectorActivity: [
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
    {
      latestPublicationAt: null,
      publishedChallengeCount: 1,
      publishedSolutionCount: 0,
      sectorId: "sector-aviation",
      sectorName: "Aviation",
      sectorSlug: "aviation",
    },
  ],
  solutions: [
    {
      accessModel: "free" as const,
      companyId: "company-1",
      companyLogoPath: null,
      companyName: "TechSolutions UAE",
      companySlug: "techsolutions-uae",
      coverageLabel: "Global",
      id: "solution-1",
      linkedChallengeCount: 3,
      offeringDescription: "Autonomous underwater diagnostics.",
      publishedAt: "2026-04-06T09:00:00.000Z",
      sectorId: "sector-oil",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
      slug: "subsea-corrosion-mapping",
      status: "published" as const,
      summary: "Autonomous underwater diagnostics.",
      title: "Subsea Corrosion Mapping",
      voteCount: 47,
    },
  ],
};

describe("public dashboard data", () => {
  it("builds a live dashboard view model from public-safe records", () => {
    const viewModel = buildPublicDashboardViewModel({
      generatedAt: "2026-04-06T12:00:00.000Z",
      source: "live",
      snapshot: liveSnapshot,
    });

    expect(viewModel.state).toBe("live");
    expect(viewModel.heroStats.map((item) => item.value)).toEqual(["7", "5", "12", "50%"]);
    expect(viewModel.statCards[0]?.change).toBe("13 governed sectors");
    expect(viewModel.statCards[3]?.value).toBe("50%");
    expect(viewModel.statCards[0]?.points).toHaveLength(6);
    expect(viewModel.recentChallenges[0]).toMatchObject({
      anonymous: true,
      companyInitials: "👤",
      companyLabel: undefined,
      href: "/challenges/hospital-interoperability",
      sectorLabel: "Healthcare",
      statusLabel: "Published",
    });
    expect(viewModel.recentChallenges[1]).toMatchObject({
      anonymous: false,
      companyLabel: "ADNOC Group",
      companyInitials: "AG",
      statusLabel: "Matched",
    });
    expect(viewModel.recentChallenges[0]?.meta).toEqual([
      { icon: "💡", value: "0" },
      { icon: "⏱", value: "Yesterday" },
      { icon: "📍", value: "UAE" },
    ]);
    expect(viewModel.recentSolutions[0]).toMatchObject({
      engagementLabel: "3 matches",
      publicationLabel: "Free Solution",
      regionLabel: "Global · TechSolutions UAE",
      votes: 47,
    });
    expect(viewModel.sectorPills[1]).toEqual({
      label: "Oil & Gas",
      slug: "oil-gas",
    });
    expect(viewModel.sectorProgress.map((row) => row.label)).toEqual([
      "Oil & Gas",
      "Healthcare",
      "Aviation",
    ]);
    expect(viewModel.sectorProgress[0]?.tone).toBe("gold");
    expect(viewModel.activityFeed[0]).toMatchObject({
      color: "var(--green)",
      text: "Solution posted — Subsea Corrosion Mapping",
    });
    expect(viewModel.readiness.metric).toBe("T07");
  });

  it("returns a setup state when Supabase is not configured yet", () => {
    const viewModel = buildPublicDashboardViewModel({
      generatedAt: "2026-04-06T12:00:00.000Z",
      source: "setup",
      snapshot: {
        activitySignals: [],
        challenges: [],
        metrics: null,
        sectorActivity: [],
        solutions: [],
      },
    });

    expect(viewModel.state).toBe("setup");
    expect(viewModel.heroStats.map((item) => item.value)).toEqual(["0", "0", "0", "0%"]);
    expect(viewModel.heroStats[3]?.label).toBe("Resolution Rate");
    expect(viewModel.readiness.note).toContain("Connect NEXT_PUBLIC_SUPABASE_URL");
  });

  it("returns an empty live state when the query path is active but no public records exist", () => {
    const viewModel = buildPublicDashboardViewModel({
      generatedAt: "2026-04-06T12:00:00.000Z",
      source: "live",
      snapshot: {
        activitySignals: [],
        challenges: [],
        metrics: {
          latestActivityAt: null,
          publicCompanyCount: 0,
          publicSignalCount: 0,
          publishedChallengeCount: 0,
          publishedSolutionCount: 0,
          visibleSectorCount: 13,
        },
        sectorActivity: [],
        solutions: [],
      },
    });

    expect(viewModel.state).toBe("empty");
    expect(viewModel.recentChallenges).toEqual([]);
    expect(viewModel.readiness.note).toContain("no published challenges");
  });
});
