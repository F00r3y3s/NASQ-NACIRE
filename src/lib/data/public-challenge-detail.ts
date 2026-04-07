import { cache } from "react";

import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import type {
  PublicChallengeRecord,
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

type DetailResponseGuidanceItem = {
  detail: string;
  title: string;
};

type DetailSectorContext = {
  description: string;
  metric: string;
  title: string;
};

type DetailLinkedSolutionCard = {
  engagementLabel: string;
  href: string;
  publicationLabel: string;
  publicationTone: DetailTone;
  regionLabel: string;
  sectorLabel: string;
  sectorTone: DetailTone;
  summary: string;
  title: string;
  votes: number;
};

export type PublicChallengeDetailViewModel = {
  anonymityMode: PublicChallengeRecord["anonymityMode"] | null;
  badges: DetailBadge[];
  emptySolutionsMessage: string;
  id: string | null;
  isOpenChallenge: boolean;
  linkedSolutionCards: DetailLinkedSolutionCard[];
  metadata: DetailMetadataItem[];
  responseGuidance: DetailResponseGuidanceItem[];
  sectorContext: DetailSectorContext;
  state: DetailState;
  summary: string;
  title: string;
  desiredOutcome: string | null;
  problemStatement: string;
};

type BuildPublicChallengeDetailViewModelInput = {
  challenge: PublicChallengeRecord | null;
  linkedSolutions: PublicSolutionRecord[];
  sector: PublicSectorRecord | null;
  sectorActivity: PublicSectorActivityRecord | null;
  source: DetailSource;
};

function buildDemoChallengeDetail(slug: string) {
  const demo = createPublicDemoSnapshot();
  const challenge = demo.challenges.find((record) => record.slug === slug) ?? null;

  if (!challenge) {
    return null;
  }

  const linkedSolutionIds = demo.challengeLinks
    .filter((link) => link.challengeId === challenge.id)
    .map((link) => link.solutionId);

  return buildPublicChallengeDetailViewModel({
    challenge,
    linkedSolutions: demo.solutions.filter((solution) =>
      linkedSolutionIds.includes(solution.id),
    ),
    sector: demo.sectors.find((sector) => sector.slug === challenge.sectorSlug) ?? null,
    sectorActivity:
      demo.sectorActivity.find((row) => row.sectorSlug === challenge.sectorSlug) ?? null,
    source: "live",
  });
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

  return "Contact Solution";
}

function getChallengeStatusLabel(linkedSolutionCount: number) {
  return linkedSolutionCount > 0 ? "Matched Solutions" : "Open Discovery";
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

function getVisibilityLabel(challenge: PublicChallengeRecord) {
  return challenge.anonymityMode === "anonymous"
    ? "Anonymous public listing"
    : "Named public listing";
}

function getIdentityLabel(challenge: PublicChallengeRecord) {
  return challenge.anonymityMode === "anonymous"
    ? "Anonymous"
    : challenge.companyName;
}

function getSectorDescription(challenge: PublicChallengeRecord, sector: PublicSectorRecord | null) {
  if (sector?.description) {
    return sector.description;
  }

  return (
    sectorSeeds.find((item) => item.slug === challenge.sectorSlug)?.description ??
    "Governed sector context is available through the public taxonomy."
  );
}

function toLinkedSolutionCard(solution: PublicSolutionRecord): DetailLinkedSolutionCard {
  return {
    engagementLabel: `${solution.linkedChallengeCount} match${
      solution.linkedChallengeCount === 1 ? "" : "es"
    }`,
    href: `/solutions/${solution.slug}`,
    publicationLabel: toPublicationLabel(solution.accessModel),
    publicationTone: resolvePublicationTone(solution.accessModel),
    regionLabel: `${solution.coverageLabel ?? "Public listing"} · ${solution.companyName}`,
    sectorLabel: solution.sectorName,
    sectorTone: resolveSectorTone(solution.sectorName),
    summary: solution.summary,
    title: solution.title,
    votes: solution.voteCount,
  };
}

function buildBadges(challenge: PublicChallengeRecord) {
  return [
    { label: "Public-safe Detail", tone: "green" as const },
    challenge.anonymityMode === "anonymous"
      ? { label: "Anonymous Posting", tone: "blue" as const }
      : { label: "Named Company", tone: "gold" as const },
    challenge.linkedSolutionCount > 0
      ? {
          label: `${challenge.linkedSolutionCount} Linked Solution${
            challenge.linkedSolutionCount === 1 ? "" : "s"
          }`,
          tone: "teal" as const,
        }
      : { label: "No Linked Solutions Yet", tone: "red" as const },
  ];
}

function buildMetadata(
  challenge: PublicChallengeRecord,
  linkedSolutions: PublicSolutionRecord[],
): DetailMetadataItem[] {
  return [
    { label: "Sector", value: challenge.sectorName },
    { label: "Geography", value: challenge.geographyLabel ?? "Public / undisclosed" },
    { label: "Identity", value: getIdentityLabel(challenge) },
    { label: "Visibility", value: getVisibilityLabel(challenge) },
    { label: "Status", value: getChallengeStatusLabel(challenge.linkedSolutionCount) },
    { label: "Published", value: formatPublishedAt(challenge.publishedAt) },
    {
      label: "Linked Solutions",
      value: `${linkedSolutions.length} public match${linkedSolutions.length === 1 ? "" : "es"}`,
    },
    {
      label: "Browse Route",
      value: `/challenges/${challenge.slug}`,
    },
  ];
}

function buildResponseGuidance(challenge: PublicChallengeRecord): DetailResponseGuidanceItem[] {
  return [
    {
      detail:
        "Public users can read the full safe record, sector context, and available linked solutions without signing in.",
      title: "Open discovery",
    },
    {
      detail:
        challenge.anonymityMode === "anonymous"
          ? "Verified-member response will route through the platform relay in T13 so the owner remains confidential."
          : "Verified members can prepare reusable solutions now, with direct public company identity already visible on this record.",
      title: "Response path",
    },
    {
      detail:
        "Use the AI assistant or solution browse flow to explore adjacent records before responding or publishing a reusable solution.",
      title: "Next best action",
    },
  ];
}

export function buildPublicChallengeDetailViewModel({
  challenge,
  linkedSolutions,
  sector,
  sectorActivity,
  source,
}: BuildPublicChallengeDetailViewModelInput): PublicChallengeDetailViewModel {
  if (source === "setup" || challenge === null) {
    return {
      anonymityMode: null,
      badges: [
        { label: "Public-safe Detail", tone: "green" },
        { label: "Setup Required", tone: "gold" },
      ],
      desiredOutcome: null,
      emptySolutionsMessage:
        "Connect Supabase to load challenge-specific linked solutions and safe metadata.",
      id: null,
      isOpenChallenge: false,
      linkedSolutionCards: [],
      metadata: [],
      problemStatement:
        "The detail route is ready for live public-safe records but needs Supabase credentials before it can load them.",
      responseGuidance: [
        {
          detail: "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to activate live detail reads.",
          title: "Setup",
        },
      ],
      sectorContext: {
        description: "Governed sector context will appear once the public sector views are available.",
        metric: "T09 detail route",
        title: "Sector context pending",
      },
      state: source === "error" ? "error" : "setup",
      summary:
        source === "error"
          ? "The challenge detail query path could not be verified in the target Supabase project."
          : "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load a live public-safe challenge detail page.",
      title: "Challenge Detail",
    };
  }

  return {
    anonymityMode: challenge.anonymityMode,
    badges: buildBadges(challenge),
    desiredOutcome: challenge.desiredOutcome ?? null,
    emptySolutionsMessage:
      "No linked public solutions are attached to this challenge yet. Browse reusable solutions or ask AI to explore adjacent records.",
    id: challenge.id,
    isOpenChallenge: challenge.linkedSolutionCount === 0,
    linkedSolutionCards: linkedSolutions.map(toLinkedSolutionCard),
    metadata: buildMetadata(challenge, linkedSolutions),
    problemStatement: challenge.problemStatement,
    responseGuidance: buildResponseGuidance(challenge),
    sectorContext: {
      description: getSectorDescription(challenge, sector),
      metric: sectorActivity
        ? `${sectorActivity.publishedChallengeCount} challenges · ${sectorActivity.publishedSolutionCount} solutions`
        : "Public sector activity is ready to load",
      title: `${challenge.sectorName} sector context`,
    },
    state: "live",
    summary: challenge.summary,
    title: challenge.title,
  };
}

export const getPublicChallengeDetailViewModel = cache(async (slug: string) => {
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      const demoDetail = buildDemoChallengeDetail(slug);

      if (demoDetail) {
        return demoDetail;
      }
    }

    return buildPublicChallengeDetailViewModel({
      challenge: null,
      linkedSolutions: [],
      sector: null,
      sectorActivity: null,
      source: "setup",
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const challengeResult = await supabase
      .from(publicReadModelCatalog.publicChallenges)
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (challengeResult.error) {
      console.error("Failed to load public challenge detail", challengeResult.error);

      if (demoEnabled) {
        const demoDetail = buildDemoChallengeDetail(slug);

        if (demoDetail) {
          return demoDetail;
        }
      }

      return buildPublicChallengeDetailViewModel({
        challenge: null,
        linkedSolutions: [],
        sector: null,
        sectorActivity: null,
        source: "error",
      });
    }

    if (!challengeResult.data) {
      if (demoEnabled) {
        return buildDemoChallengeDetail(slug);
      }

      return null;
    }

    const challenge = mapPublicChallengeRow(
      challengeResult.data as Parameters<typeof mapPublicChallengeRow>[0],
    );
    const [sectorResult, sectorActivityResult, linksResult] = await Promise.all([
      supabase
        .from(publicReadModelCatalog.publicSectors)
        .select("*")
        .eq("slug", challenge.sectorSlug)
        .maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicSectorActivity)
        .select("*")
        .eq("sector_slug", challenge.sectorSlug)
        .maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicChallengeLinks)
        .select("*")
        .eq("challenge_id", challenge.id),
    ]);

    const secondaryResults = [sectorResult, sectorActivityResult, linksResult];
    const secondaryError = secondaryResults.find((result) => result.error);

    if (secondaryError?.error) {
      console.error("Failed to load challenge detail supporting context", secondaryError.error);

      return buildPublicChallengeDetailViewModel({
        challenge,
        linkedSolutions: [],
        sector: null,
        sectorActivity: null,
        source: "error",
      });
    }

    const linkRecords = ((linksResult.data ?? []) as Parameters<
      typeof mapPublicChallengeSolutionLinkRow
    >[0][]).map(mapPublicChallengeSolutionLinkRow);
    const solutionIds = linkRecords.map((link) => link.solutionId);
    let linkedSolutions: PublicSolutionRecord[] = [];

    if (solutionIds.length > 0) {
      const solutionsResult = await supabase
        .from(publicReadModelCatalog.publicSolutions)
        .select("*")
        .in("id", solutionIds)
        .order("vote_count", { ascending: false })
        .order("published_at", { ascending: false });

      if (solutionsResult.error) {
        console.error("Failed to load linked public solutions", solutionsResult.error);

        return buildPublicChallengeDetailViewModel({
          challenge,
          linkedSolutions: [],
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
          source: "error",
        });
      }

      linkedSolutions = ((solutionsResult.data ?? []) as Parameters<typeof mapPublicSolutionRow>[0][])
        .map(mapPublicSolutionRow);
    }

    return buildPublicChallengeDetailViewModel({
      challenge,
      linkedSolutions,
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
      source: "live",
    });
  } catch (error) {
    console.error("Unexpected public challenge detail failure", error);

    if (demoEnabled) {
      const demoDetail = buildDemoChallengeDetail(slug);

      if (demoDetail) {
        return demoDetail;
      }
    }

    return buildPublicChallengeDetailViewModel({
      challenge: null,
      linkedSolutions: [],
      sector: null,
      sectorActivity: null,
      source: "error",
    });
  }
});
