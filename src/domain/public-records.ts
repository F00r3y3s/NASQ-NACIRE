export const publicReadModelCatalog = {
  publicActivitySignals: "public_activity_signals",
  publicChallengeLinks: "public_challenge_solution_links",
  publicChallenges: "public_challenges",
  publicCompanies: "public_company_profiles",
  publicPlatformMetrics: "public_platform_metrics",
  publicSectorActivity: "public_sector_activity",
  publicSectors: "public_sectors",
  publicSolutions: "public_solutions",
} as const;

export interface PublicSectorRecord {
  description: string;
  displayOrder: number;
  iconKey: string | null;
  id: string;
  name: string;
  slug: string;
}

export interface PublicCompanyProfileRecord {
  city: string | null;
  countryCode: string | null;
  description: string | null;
  headquartersLabel: string | null;
  id: string;
  logoPath: string | null;
  name: string;
  publishedChallengeCount: number;
  publishedSolutionCount: number;
  slug: string;
  websiteUrl: string | null;
}

export interface PublicChallengeRecord {
  anonymityMode: "named" | "anonymous";
  companyLogoPath: string | null;
  companyName: string;
  companySlug: string | null;
  desiredOutcome?: string | null;
  geographyLabel: string | null;
  id: string;
  linkedSolutionCount: number;
  problemStatement: string;
  publishedAt: string | null;
  sectorId: string;
  sectorName: string;
  sectorSlug: string;
  slug: string;
  status: "published";
  summary: string;
  title: string;
}

export interface PublicSolutionRecord {
  accessModel: "free" | "paid" | "contact";
  companyId: string;
  companyLogoPath: string | null;
  companyName: string;
  companySlug: string;
  coverageLabel: string | null;
  id: string;
  linkedChallengeCount: number;
  offeringDescription: string;
  publishedAt: string;
  sectorId: string;
  sectorName: string;
  sectorSlug: string;
  slug: string;
  status: "published";
  summary: string;
  title: string;
  voteCount: number;
}

export interface PublicChallengeSolutionLinkRecord {
  challengeId: string;
  createdAt: string;
  id: string;
  solutionId: string;
}

export interface PublicSectorActivityRecord {
  latestPublicationAt: string | null;
  publishedChallengeCount: number;
  publishedSolutionCount: number;
  sectorId: string;
  sectorName: string;
  sectorSlug: string;
}

export interface PublicPlatformMetricsRecord {
  latestActivityAt: string | null;
  publicCompanyCount: number;
  publicSignalCount: number;
  publishedChallengeCount: number;
  publishedSolutionCount: number;
  visibleSectorCount: number;
}

export interface PublicActivitySignalRecord {
  actorLabel: string;
  eventName: string;
  id: string;
  occurredAt: string;
  resourceKind: string;
  resourceLabel: string;
  route: string | null;
  sectorName: string | null;
}
