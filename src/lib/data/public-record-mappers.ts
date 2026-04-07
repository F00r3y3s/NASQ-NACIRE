import type {
  PublicActivitySignalRecord,
  PublicChallengeRecord,
  PublicChallengeSolutionLinkRecord,
  PublicCompanyProfileRecord,
  PublicPlatformMetricsRecord,
  PublicSectorActivityRecord,
  PublicSectorRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";

type PublicSectorRow = {
  description: string;
  display_order: number;
  icon_key: string | null;
  id: string;
  name: string;
  slug: string;
};

type PublicCompanyProfileRow = {
  city: string | null;
  country_code: string | null;
  description: string | null;
  headquarters_label: string | null;
  id: string;
  logo_path: string | null;
  name: string;
  published_challenge_count: number;
  published_solution_count: number;
  slug: string;
  website_url: string | null;
};

type PublicChallengeRow = {
  anonymity_mode: "named" | "anonymous";
  company_logo_path: string | null;
  company_name: string;
  company_slug: string | null;
  desired_outcome?: string | null;
  geography_label: string | null;
  id: string;
  linked_solution_count: number;
  problem_statement: string;
  published_at: string | null;
  sector_id: string;
  sector_name: string;
  sector_slug: string;
  slug: string;
  status: "published";
  summary: string;
  title: string;
};

type PublicSolutionRow = {
  access_model: "free" | "paid" | "contact";
  company_id: string;
  company_logo_path: string | null;
  company_name: string;
  company_slug: string;
  coverage_label: string | null;
  id: string;
  linked_challenge_count: number;
  offering_description: string;
  published_at: string;
  sector_id: string;
  sector_name: string;
  sector_slug: string;
  slug: string;
  status: "published";
  summary: string;
  title: string;
  vote_count: number;
};

type PublicChallengeSolutionLinkRow = {
  challenge_id: string;
  created_at: string;
  id: string;
  solution_id: string;
};

type PublicSectorActivityRow = {
  latest_publication_at: string | null;
  published_challenge_count: number;
  published_solution_count: number;
  sector_id: string;
  sector_name: string;
  sector_slug: string;
};

type PublicPlatformMetricsRow = {
  latest_activity_at: string | null;
  public_company_count: number;
  public_signal_count: number;
  published_challenge_count: number;
  published_solution_count: number;
  visible_sector_count: number;
};

type PublicActivitySignalRow = {
  actor_label: string;
  event_name: string;
  id: string;
  occurred_at: string;
  resource_kind: string;
  resource_label: string;
  route: string | null;
  sector_name: string | null;
};

function normalizeOptionalHttpUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function mapPublicSectorRow(row: PublicSectorRow): PublicSectorRecord {
  return {
    description: row.description,
    displayOrder: row.display_order,
    iconKey: row.icon_key,
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

export function mapPublicCompanyProfileRow(
  row: PublicCompanyProfileRow,
): PublicCompanyProfileRecord {
  return {
    city: row.city,
    countryCode: row.country_code,
    description: row.description,
    headquartersLabel: row.headquarters_label,
    id: row.id,
    logoPath: row.logo_path,
    name: row.name,
    publishedChallengeCount: row.published_challenge_count,
    publishedSolutionCount: row.published_solution_count,
    slug: row.slug,
    websiteUrl: normalizeOptionalHttpUrl(row.website_url),
  };
}

export function mapPublicChallengeRow(row: PublicChallengeRow): PublicChallengeRecord {
  return {
    anonymityMode: row.anonymity_mode,
    companyLogoPath: row.company_logo_path,
    companyName: row.company_name,
    companySlug: row.company_slug,
    desiredOutcome: row.desired_outcome ?? null,
    geographyLabel: row.geography_label,
    id: row.id,
    linkedSolutionCount: row.linked_solution_count,
    problemStatement: row.problem_statement,
    publishedAt: row.published_at,
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    sectorSlug: row.sector_slug,
    slug: row.slug,
    status: row.status,
    summary: row.summary,
    title: row.title,
  };
}

export function mapPublicChallengeSolutionLinkRow(
  row: PublicChallengeSolutionLinkRow,
): PublicChallengeSolutionLinkRecord {
  return {
    challengeId: row.challenge_id,
    createdAt: row.created_at,
    id: row.id,
    solutionId: row.solution_id,
  };
}

export function mapPublicSolutionRow(row: PublicSolutionRow): PublicSolutionRecord {
  return {
    accessModel: row.access_model,
    companyId: row.company_id,
    companyLogoPath: row.company_logo_path,
    companyName: row.company_name,
    companySlug: row.company_slug,
    coverageLabel: row.coverage_label,
    id: row.id,
    linkedChallengeCount: row.linked_challenge_count,
    offeringDescription: row.offering_description,
    publishedAt: row.published_at,
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    sectorSlug: row.sector_slug,
    slug: row.slug,
    status: row.status,
    summary: row.summary,
    title: row.title,
    voteCount: row.vote_count,
  };
}

export function mapPublicSectorActivityRow(
  row: PublicSectorActivityRow,
): PublicSectorActivityRecord {
  return {
    latestPublicationAt: row.latest_publication_at,
    publishedChallengeCount: row.published_challenge_count,
    publishedSolutionCount: row.published_solution_count,
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    sectorSlug: row.sector_slug,
  };
}

export function mapPublicPlatformMetricsRow(
  row: PublicPlatformMetricsRow,
): PublicPlatformMetricsRecord {
  return {
    latestActivityAt: row.latest_activity_at,
    publicCompanyCount: row.public_company_count,
    publicSignalCount: row.public_signal_count,
    publishedChallengeCount: row.published_challenge_count,
    publishedSolutionCount: row.published_solution_count,
    visibleSectorCount: row.visible_sector_count,
  };
}

export function mapPublicActivitySignalRow(
  row: PublicActivitySignalRow,
): PublicActivitySignalRecord {
  return {
    actorLabel: row.actor_label,
    eventName: row.event_name,
    id: row.id,
    occurredAt: row.occurred_at,
    resourceKind: row.resource_kind,
    resourceLabel: row.resource_label,
    route: row.route,
    sectorName: row.sector_name,
  };
}
