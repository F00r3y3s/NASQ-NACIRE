import { describe, expect, it } from "vitest";

import {
  mapPublicActivitySignalRow,
  mapPublicChallengeRow,
  mapPublicChallengeSolutionLinkRow,
  mapPublicCompanyProfileRow,
  mapPublicPlatformMetricsRow,
  mapPublicSectorActivityRow,
  mapPublicSectorRow,
  mapPublicSolutionRow,
} from "@/lib/data/public-record-mappers";

describe("public record mappers", () => {
  it("maps snake_case public challenge and solution rows into camelCase domain records", () => {
    expect(
      mapPublicChallengeRow({
        anonymity_mode: "anonymous",
        company_logo_path: null,
        company_name: "Anonymous",
        company_slug: null,
        geography_label: "UAE",
        id: "challenge-1",
        linked_solution_count: 2,
        desired_outcome: "Unified emergency response records.",
        problem_statement: "Fragmented data delays response.",
        published_at: "2026-04-06T08:00:00.000Z",
        sector_id: "sector-1",
        sector_name: "Healthcare",
        sector_slug: "healthcare",
        slug: "hospital-interoperability",
        status: "published",
        summary: "Fragmented records delay care.",
        title: "Hospital Interoperability",
      }),
    ).toEqual({
      anonymityMode: "anonymous",
      companyLogoPath: null,
      companyName: "Anonymous",
      companySlug: null,
      geographyLabel: "UAE",
      id: "challenge-1",
      linkedSolutionCount: 2,
      desiredOutcome: "Unified emergency response records.",
      problemStatement: "Fragmented data delays response.",
      publishedAt: "2026-04-06T08:00:00.000Z",
      sectorId: "sector-1",
      sectorName: "Healthcare",
      sectorSlug: "healthcare",
      slug: "hospital-interoperability",
      status: "published",
      summary: "Fragmented records delay care.",
      title: "Hospital Interoperability",
    });

    expect(
      mapPublicSolutionRow({
        access_model: "free",
        company_id: "company-1",
        company_logo_path: null,
        company_name: "TechSolutions UAE",
        company_slug: "techsolutions-uae",
        coverage_label: "Global",
        id: "solution-1",
        linked_challenge_count: 3,
        offering_description: "Autonomous underwater diagnostics with anomaly scoring.",
        published_at: "2026-04-06T09:00:00.000Z",
        sector_id: "sector-1",
        sector_name: "Oil & Gas",
        sector_slug: "oil-gas",
        slug: "subsea-corrosion-mapping",
        status: "published",
        summary: "Autonomous underwater diagnostics.",
        title: "Subsea Corrosion Mapping",
        vote_count: 47,
      }),
    ).toEqual({
      accessModel: "free",
      companyId: "company-1",
      companyLogoPath: null,
      companyName: "TechSolutions UAE",
      companySlug: "techsolutions-uae",
      coverageLabel: "Global",
      id: "solution-1",
      linkedChallengeCount: 3,
      offeringDescription: "Autonomous underwater diagnostics with anomaly scoring.",
      publishedAt: "2026-04-06T09:00:00.000Z",
      sectorId: "sector-1",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
      slug: "subsea-corrosion-mapping",
      status: "published",
      summary: "Autonomous underwater diagnostics.",
      title: "Subsea Corrosion Mapping",
      voteCount: 47,
    });
  });

  it("maps sector, activity, and platform metric rows into camelCase records", () => {
    expect(
      mapPublicChallengeSolutionLinkRow({
        challenge_id: "challenge-1",
        created_at: "2026-04-06T11:00:00.000Z",
        id: "link-1",
        solution_id: "solution-1",
      }),
    ).toEqual({
      challengeId: "challenge-1",
      createdAt: "2026-04-06T11:00:00.000Z",
      id: "link-1",
      solutionId: "solution-1",
    });

    expect(
      mapPublicSectorRow({
        description: "Healthcare systems and patient operations.",
        display_order: 4,
        icon_key: "healthcare",
        id: "sector-1",
        name: "Healthcare",
        slug: "healthcare",
      }),
    ).toEqual({
      description: "Healthcare systems and patient operations.",
      displayOrder: 4,
      iconKey: "healthcare",
      id: "sector-1",
      name: "Healthcare",
      slug: "healthcare",
    });

    expect(
      mapPublicCompanyProfileRow({
        city: "Abu Dhabi",
        country_code: "AE",
        description: "Industrial systems provider.",
        headquarters_label: "Abu Dhabi, UAE",
        id: "company-1",
        logo_path: null,
        name: "TechSolutions UAE",
        published_challenge_count: 1,
        published_solution_count: 3,
        slug: "techsolutions-uae",
        website_url: "javascript:alert('xss')",
      }),
    ).toEqual({
      city: "Abu Dhabi",
      countryCode: "AE",
      description: "Industrial systems provider.",
      headquartersLabel: "Abu Dhabi, UAE",
      id: "company-1",
      logoPath: null,
      name: "TechSolutions UAE",
      publishedChallengeCount: 1,
      publishedSolutionCount: 3,
      slug: "techsolutions-uae",
      websiteUrl: null,
    });

    expect(
      mapPublicSectorActivityRow({
        latest_publication_at: "2026-04-06T08:00:00.000Z",
        published_challenge_count: 4,
        published_solution_count: 3,
        sector_id: "sector-1",
        sector_name: "Oil & Gas",
        sector_slug: "oil-gas",
      }),
    ).toEqual({
      latestPublicationAt: "2026-04-06T08:00:00.000Z",
      publishedChallengeCount: 4,
      publishedSolutionCount: 3,
      sectorId: "sector-1",
      sectorName: "Oil & Gas",
      sectorSlug: "oil-gas",
    });

    expect(
      mapPublicActivitySignalRow({
        actor_label: "Member",
        event_name: "solution_published",
        id: "signal-1",
        occurred_at: "2026-04-06T10:00:00.000Z",
        resource_kind: "solution",
        resource_label: "Subsea Corrosion Mapping",
        route: "/solutions/subsea-corrosion-mapping",
        sector_name: "Oil & Gas",
      }),
    ).toEqual({
      actorLabel: "Member",
      eventName: "solution_published",
      id: "signal-1",
      occurredAt: "2026-04-06T10:00:00.000Z",
      resourceKind: "solution",
      resourceLabel: "Subsea Corrosion Mapping",
      route: "/solutions/subsea-corrosion-mapping",
      sectorName: "Oil & Gas",
    });

    expect(
      mapPublicPlatformMetricsRow({
        latest_activity_at: "2026-04-06T10:00:00.000Z",
        public_company_count: 12,
        public_signal_count: 6,
        published_challenge_count: 7,
        published_solution_count: 5,
        visible_sector_count: 13,
      }),
    ).toEqual({
      latestActivityAt: "2026-04-06T10:00:00.000Z",
      publicCompanyCount: 12,
      publicSignalCount: 6,
      publishedChallengeCount: 7,
      publishedSolutionCount: 5,
      visibleSectorCount: 13,
    });
  });
});
