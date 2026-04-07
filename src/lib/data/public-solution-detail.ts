import { cache } from "react";

import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import type {
  PublicChallengeRecord,
  PublicCompanyProfileRecord,
  PublicSectorActivityRecord,
  PublicSectorRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import { publicReadModelCatalog } from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";
import { createPublicDemoSnapshot } from "@/lib/demo/public-demo-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  mapPublicChallengeRow,
  mapPublicChallengeSolutionLinkRow,
  mapPublicCompanyProfileRow,
  mapPublicSectorActivityRow,
  mapPublicSectorRow,
  mapPublicSolutionRow,
} from "./public-record-mappers";

type DetailSource = "error" | "live" | "setup";
type DetailState = "error" | "live" | "setup";
type DetailTone = "blue" | "gold" | "green" | "red" | "teal";

type DetailBadge = {
  label: string;
  tone: DetailTone;
};

type DetailMetadataItem = {
  label: string;
  value: string;
};

type DetailGuidanceItem = {
  detail: string;
  title: string;
};

type DetailSectorContext = {
  description: string;
  metric: string;
  title: string;
};

type DetailProviderProfile = {
  description: string;
  headquartersLabel: string | null;
  locationLabel: string;
  name: string;
  publishedChallengeCount: number;
  publishedSolutionCount: number;
  websiteUrl: string | null;
};

type DetailLinkedChallengeCard = {
  anonymous?: boolean;
  companyLabel?: string;
  href: string;
  meta: string[];
  sectorLabel: string;
  sectorTone: DetailTone;
  statusLabel: string;
  statusTone: DetailTone;
  summary: string;
  title: string;
};

export type PublicSolutionDetailViewModel = {
  badges: DetailBadge[];
  emptyChallengesMessage: string;
  linkedChallengeCards: DetailLinkedChallengeCard[];
  metadata: DetailMetadataItem[];
  offeringDescription: string;
  providerGuidance: DetailGuidanceItem[];
  providerProfile: DetailProviderProfile | null;
  sectorContext: DetailSectorContext;
  state: DetailState;
  summary: string;
  title: string;
};

type BuildPublicSolutionDetailViewModelInput = {
  linkedChallenges: PublicChallengeRecord[];
  provider: PublicCompanyProfileRecord | null;
  sector: PublicSectorRecord | null;
  sectorActivity: PublicSectorActivityRecord | null;
  solution: PublicSolutionRecord | null;
  source: DetailSource;
};

function buildDemoSolutionDetail(slug: string) {
  const demo = createPublicDemoSnapshot();
  const solution = demo.solutions.find((record) => record.slug === slug) ?? null;

  if (!solution) {
    return null;
  }

  const linkedChallengeIds = demo.challengeLinks
    .filter((link) => link.solutionId === solution.id)
    .map((link) => link.challengeId);

  return buildPublicSolutionDetailViewModel({
    linkedChallenges: demo.challenges.filter((challenge) =>
      linkedChallengeIds.includes(challenge.id),
    ),
    provider: demo.companies.find((company) => company.id === solution.companyId) ?? null,
    sector: demo.sectors.find((sector) => sector.slug === solution.sectorSlug) ?? null,
    sectorActivity:
      demo.sectorActivity.find((row) => row.sectorSlug === solution.sectorSlug) ?? null,
    solution,
    source: "live",
  });
}

function formatSectorMetric(sectorActivity: PublicSectorActivityRecord | null) {
  if (!sectorActivity) {
    return "Public sector activity is ready to load";
  }

  return `${sectorActivity.publishedChallengeCount} challenges · ${sectorActivity.publishedSolutionCount} solutions`;
}

function resolveSectorTone(sectorName: string): DetailTone {
  if (sectorName === "Oil & Gas" || sectorName === "Energy & Utilities") {
    return "gold";
  }

  if (sectorName === "Healthcare" || sectorName === "Finance & Banking") {
    return "blue";
  }

  if (
    sectorName === "Construction & Infrastructure" ||
    sectorName === "Logistics & Supply Chain"
  ) {
    return "teal";
  }

  return "green";
}

function resolvePublicationTone(accessModel: PublicSolutionRecord["accessModel"]): DetailTone {
  if (accessModel === "free") {
    return "green";
  }

  if (accessModel === "paid") {
    return "gold";
  }

  return "blue";
}

function toPublicationLabel(accessModel: PublicSolutionRecord["accessModel"]) {
  if (accessModel === "free") {
    return "Free Solution";
  }

  if (accessModel === "paid") {
    return "Paid Solution";
  }

  return "Contact Provider";
}

function getChallengeStatus(linkedSolutionCount: number) {
  if (linkedSolutionCount > 0) {
    return {
      label: "Matched",
      tone: "green" as const,
    };
  }

  return {
    label: "Open",
    tone: "red" as const,
  };
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "Awaiting publication";
  }

  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatGeographyLabel(geographyLabel: string | null) {
  if (!geographyLabel) {
    return "🌍 Public";
  }

  if (geographyLabel.toLowerCase().includes("global")) {
    return `🌍 ${geographyLabel}`;
  }

  return `📍 ${geographyLabel}`;
}

function getSectorDescription(solution: PublicSolutionRecord, sector: PublicSectorRecord | null) {
  if (sector?.description) {
    return sector.description;
  }

  return (
    sectorSeeds.find((item) => item.slug === solution.sectorSlug)?.description ??
    "Governed sector context is available through the public taxonomy."
  );
}

function toLinkedChallengeCard(challenge: PublicChallengeRecord): DetailLinkedChallengeCard {
  const status = getChallengeStatus(challenge.linkedSolutionCount);
  const anonymous = challenge.anonymityMode === "anonymous";

  return {
    anonymous,
    companyLabel: anonymous ? undefined : challenge.companyName,
    href: `/challenges/${challenge.slug}`,
    meta: [
      `💡 ${challenge.linkedSolutionCount}`,
      formatGeographyLabel(challenge.geographyLabel),
      `⏱ ${formatPublishedAt(challenge.publishedAt)}`,
    ],
    sectorLabel: challenge.sectorName,
    sectorTone: resolveSectorTone(challenge.sectorName),
    statusLabel: status.label,
    statusTone: status.tone,
    summary: challenge.summary,
    title: challenge.title,
  };
}

function buildBadges(solution: PublicSolutionRecord) {
  return [
    { label: "Public Solution", tone: "green" as const },
    {
      label: toPublicationLabel(solution.accessModel),
      tone: resolvePublicationTone(solution.accessModel),
    },
    solution.linkedChallengeCount > 0
      ? {
          label: `${solution.linkedChallengeCount} Linked Challenge${
            solution.linkedChallengeCount === 1 ? "" : "s"
          }`,
          tone: "teal" as const,
        }
      : { label: "Standalone Record", tone: "gold" as const },
  ];
}

function buildMetadata(
  solution: PublicSolutionRecord,
  provider: PublicCompanyProfileRecord | null,
  linkedChallenges: PublicChallengeRecord[],
): DetailMetadataItem[] {
  return [
    { label: "Sector", value: solution.sectorName },
    { label: "Coverage", value: solution.coverageLabel ?? "Public listing" },
    { label: "Access", value: toPublicationLabel(solution.accessModel) },
    { label: "Provider", value: provider?.name ?? solution.companyName },
    { label: "Published", value: formatPublishedAt(solution.publishedAt) },
    { label: "Votes", value: String(solution.voteCount) },
    {
      label: "Linked Challenges",
      value: `${linkedChallenges.length} public match${linkedChallenges.length === 1 ? "" : "es"}`,
    },
    {
      label: "Browse Route",
      value: `/solutions/${solution.slug}`,
    },
  ];
}

function buildProviderProfile(provider: PublicCompanyProfileRecord | null): DetailProviderProfile | null {
  if (!provider) {
    return null;
  }

  const derivedLocation = [provider.city, provider.countryCode].filter(Boolean).join(", ");
  const locationLabel =
    provider.headquartersLabel || derivedLocation || "Public company profile";

  return {
    description:
      provider.description ??
      "Verified public company profile supporting named solution publication on NASQ NACIRE.",
    headquartersLabel: provider.headquartersLabel,
    locationLabel: locationLabel || "Public company profile",
    name: provider.name,
    publishedChallengeCount: provider.publishedChallengeCount,
    publishedSolutionCount: provider.publishedSolutionCount,
    websiteUrl: provider.websiteUrl,
  };
}

function buildProviderGuidance(
  solution: PublicSolutionRecord,
  provider: PublicCompanyProfileRecord | null,
): DetailGuidanceItem[] {
  return [
    {
      detail:
        "Public users can inspect this reusable solution, provider context, and linked challenges without signing in.",
      title: "Open discovery",
    },
    {
      detail:
        provider
          ? `${provider.name} is visible here because public solutions only surface from public company profiles in v1.`
          : "Provider identity is available when the public company profile record resolves successfully.",
      title: "Provider identity",
    },
    {
      detail:
        solution.linkedChallengeCount > 0
          ? "Linked challenges show where this solution already maps to public problem statements across the platform."
          : "This solution is currently standalone, which makes it reusable across future challenge matches without being tied to only one demand record.",
      title: "Reuse signal",
    },
  ];
}

export function buildPublicSolutionDetailViewModel({
  linkedChallenges,
  provider,
  sector,
  sectorActivity,
  solution,
  source,
}: BuildPublicSolutionDetailViewModelInput): PublicSolutionDetailViewModel {
  if (source === "setup") {
    return {
      badges: [
        { label: "Public Solution", tone: "green" },
        { label: "Setup Required", tone: "gold" },
      ],
      emptyChallengesMessage:
        "Connect Supabase to load linked challenge context and provider metadata.",
      linkedChallengeCards: [],
      metadata: [],
      offeringDescription:
        "The solution detail route is ready for live public-safe records but needs Supabase credentials before it can load them.",
      providerGuidance: [
        {
          detail: "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to activate live detail reads.",
          title: "Setup",
        },
      ],
      providerProfile: null,
      sectorContext: {
        description: "Governed sector context will appear once the public sector views are available.",
        metric: "T12 detail route",
        title: "Sector context pending",
      },
      state: "setup",
      summary:
        "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load a live public solution detail page.",
      title: "Solution Detail",
    };
  }

  if (source === "error") {
    if (solution === null) {
      return {
        badges: [
          { label: "Public Solution", tone: "green" },
          { label: "Query Error", tone: "red" },
        ],
        emptyChallengesMessage:
          "The solution detail query path could not load linked challenge context from the public views.",
        linkedChallengeCards: [],
        metadata: [],
        offeringDescription:
          "The solution detail route is wired to public-safe records, but the query path could not be verified in the target Supabase project.",
        providerGuidance: [
          {
            detail:
              "Verify the T04 and T06 migrations plus the public company, challenge-link, and sector views in Supabase.",
            title: "Public read-model error",
          },
        ],
        providerProfile: null,
        sectorContext: {
          description:
            "Governed sector context will appear once the public solution detail query path resolves again.",
          metric: "Public views unavailable",
          title: "Sector context unavailable",
        },
        state: "error",
        summary:
          "The solution detail query path could not be verified in the target Supabase project.",
        title: "Solution Detail",
      };
    }

    return {
      badges: [...buildBadges(solution), { label: "Query Error", tone: "red" }],
      emptyChallengesMessage:
        linkedChallenges.length > 0
          ? "Only the linked public challenges that resolved successfully are shown right now."
          : "The core solution loaded, but linked challenge context could not be verified from the public views right now.",
      linkedChallengeCards: linkedChallenges.map(toLinkedChallengeCard),
      metadata: buildMetadata(solution, provider, linkedChallenges),
      offeringDescription: solution.offeringDescription,
      providerGuidance: [
        {
          detail:
            "The main solution record is visible, but some supporting provider, challenge-link, or sector context could not be verified from the public-safe views.",
          title: "Partial public context",
        },
        ...buildProviderGuidance(solution, provider),
      ],
      providerProfile: buildProviderProfile(provider),
      sectorContext: {
        description: getSectorDescription(solution, sector),
        metric: formatSectorMetric(sectorActivity),
        title: `${solution.sectorName} sector context`,
      },
      state: "error",
      summary:
        "The core solution record loaded, but some supporting public context could not be verified right now.",
      title: solution.title,
    };
  }

  if (solution === null) {
    return {
      badges: [
        { label: "Public Solution", tone: "green" },
        { label: "Setup Required", tone: "gold" },
      ],
      emptyChallengesMessage:
        "Connect Supabase to load linked challenge context and provider metadata.",
      linkedChallengeCards: [],
      metadata: [],
      offeringDescription:
        "The solution detail route is ready for live public-safe records but needs Supabase credentials before it can load them.",
      providerGuidance: [
        {
          detail: "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to activate live detail reads.",
          title: "Setup",
        },
      ],
      providerProfile: null,
      sectorContext: {
        description: "Governed sector context will appear once the public sector views are available.",
        metric: "T12 detail route",
        title: "Sector context pending",
      },
      state: "setup",
      summary:
        "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load a live public solution detail page.",
      title: "Solution Detail",
    };
  }

  return {
    badges: buildBadges(solution),
    emptyChallengesMessage:
      "This solution is not linked to public challenges yet. It remains reusable and can still be discovered as a standalone record.",
    linkedChallengeCards: linkedChallenges.map(toLinkedChallengeCard),
    metadata: buildMetadata(solution, provider, linkedChallenges),
    offeringDescription: solution.offeringDescription,
    providerGuidance: buildProviderGuidance(solution, provider),
    providerProfile: buildProviderProfile(provider),
    sectorContext: {
      description: getSectorDescription(solution, sector),
      metric: formatSectorMetric(sectorActivity),
      title: `${solution.sectorName} sector context`,
    },
    state: "live",
    summary: solution.summary,
    title: solution.title,
  };
}

export const getPublicSolutionDetailViewModel = cache(async (slug: string) => {
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      const demoDetail = buildDemoSolutionDetail(slug);

      if (demoDetail) {
        return demoDetail;
      }
    }

    return buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider: null,
      sector: null,
      sectorActivity: null,
      solution: null,
      source: "setup",
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const solutionResult = await supabase
      .from(publicReadModelCatalog.publicSolutions)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (solutionResult.error) {
      console.error("Failed to load public solution detail", solutionResult.error);

      if (demoEnabled) {
        const demoDetail = buildDemoSolutionDetail(slug);

        if (demoDetail) {
          return demoDetail;
        }
      }

      return buildPublicSolutionDetailViewModel({
        linkedChallenges: [],
        provider: null,
        sector: null,
        sectorActivity: null,
        solution: null,
        source: "error",
      });
    }

    if (!solutionResult.data) {
      if (demoEnabled) {
        return buildDemoSolutionDetail(slug);
      }

      return null;
    }

    const solution = mapPublicSolutionRow(
      solutionResult.data as Parameters<typeof mapPublicSolutionRow>[0],
    );
    const [providerResult, sectorResult, sectorActivityResult, linksResult] = await Promise.all([
      supabase
        .from(publicReadModelCatalog.publicCompanies)
        .select("*")
        .eq("slug", solution.companySlug)
        .maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicSectors)
        .select("*")
        .eq("slug", solution.sectorSlug)
        .maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicSectorActivity)
        .select("*")
        .eq("sector_slug", solution.sectorSlug)
        .maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicChallengeLinks)
        .select("*")
        .eq("solution_id", solution.id),
    ]);

    const secondaryResults = [providerResult, sectorResult, sectorActivityResult, linksResult];
    const secondaryError = secondaryResults.find((result) => result.error);

    if (secondaryError?.error) {
      console.error("Failed to load solution detail supporting context", secondaryError.error);

      return buildPublicSolutionDetailViewModel({
        linkedChallenges: [],
        provider:
          providerResult.data === null
            ? null
            : mapPublicCompanyProfileRow(
                providerResult.data as Parameters<typeof mapPublicCompanyProfileRow>[0],
              ),
        sector:
          sectorResult.data === null
            ? null
            : mapPublicSectorRow(sectorResult.data as Parameters<typeof mapPublicSectorRow>[0]),
        sectorActivity:
          sectorActivityResult.data === null
            ? null
            : mapPublicSectorActivityRow(
                sectorActivityResult.data as Parameters<typeof mapPublicSectorActivityRow>[0],
              ),
        solution,
        source: "error",
      });
    }

    const linkRecords = ((linksResult.data ?? []) as Parameters<
      typeof mapPublicChallengeSolutionLinkRow
    >[0][]).map(mapPublicChallengeSolutionLinkRow);
    const challengeIds = linkRecords.map((link) => link.challengeId);
    let linkedChallenges: PublicChallengeRecord[] = [];

    if (challengeIds.length > 0) {
      const challengesResult = await supabase
        .from(publicReadModelCatalog.publicChallenges)
        .select("*")
        .in("id", challengeIds)
        .order("published_at", { ascending: false });

      if (challengesResult.error) {
        console.error("Failed to load linked public challenges", challengesResult.error);

        return buildPublicSolutionDetailViewModel({
          linkedChallenges: [],
          provider:
            providerResult.data === null
              ? null
              : mapPublicCompanyProfileRow(
                  providerResult.data as Parameters<typeof mapPublicCompanyProfileRow>[0],
                ),
          sector:
            sectorResult.data === null
              ? null
              : mapPublicSectorRow(sectorResult.data as Parameters<typeof mapPublicSectorRow>[0]),
          sectorActivity:
            sectorActivityResult.data === null
              ? null
              : mapPublicSectorActivityRow(
                  sectorActivityResult.data as Parameters<typeof mapPublicSectorActivityRow>[0],
                ),
          solution,
          source: "error",
        });
      }

      linkedChallenges = ((challengesResult.data ?? []) as Parameters<typeof mapPublicChallengeRow>[0][])
        .map(mapPublicChallengeRow);
    }

    return buildPublicSolutionDetailViewModel({
      linkedChallenges,
      provider:
        providerResult.data === null
          ? null
          : mapPublicCompanyProfileRow(
              providerResult.data as Parameters<typeof mapPublicCompanyProfileRow>[0],
            ),
      sector:
        sectorResult.data === null
          ? null
          : mapPublicSectorRow(sectorResult.data as Parameters<typeof mapPublicSectorRow>[0]),
      sectorActivity:
        sectorActivityResult.data === null
          ? null
          : mapPublicSectorActivityRow(
              sectorActivityResult.data as Parameters<typeof mapPublicSectorActivityRow>[0],
            ),
      solution,
      source: "live",
    });
  } catch (error) {
    console.error("Unexpected public solution detail failure", error);

    if (demoEnabled) {
      const demoDetail = buildDemoSolutionDetail(slug);

      if (demoDetail) {
        return demoDetail;
      }
    }

    return buildPublicSolutionDetailViewModel({
      linkedChallenges: [],
      provider: null,
      sector: null,
      sectorActivity: null,
      solution: null,
      source: "error",
    });
  }
});
