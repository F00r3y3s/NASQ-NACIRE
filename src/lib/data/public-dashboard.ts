import { cache } from "react";

import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import type {
  PublicActivitySignalRecord,
  PublicChallengeRecord,
  PublicPlatformMetricsRecord,
  PublicSectorActivityRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import { createPublicDemoSnapshot } from "@/lib/demo/public-demo-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  mapPublicActivitySignalRow,
  mapPublicChallengeRow,
  mapPublicPlatformMetricsRow,
  mapPublicSectorActivityRow,
  mapPublicSolutionRow,
} from "./public-record-mappers";

type DashboardSource = "error" | "live" | "setup";
type DashboardState = "empty" | "error" | "live" | "setup";
type DashboardTone = "blue" | "gold" | "green" | "red" | "teal";

type DashboardSnapshot = {
  activitySignals: PublicActivitySignalRecord[];
  challenges: PublicChallengeRecord[];
  metrics: PublicPlatformMetricsRecord | null;
  sectorActivity: PublicSectorActivityRecord[];
  solutions: PublicSolutionRecord[];
};

type DashboardMetricDisplay = {
  accent?: "green";
  label: string;
  value: string;
};

type DashboardSparkPointSeries = number[];

type DashboardStatCard = {
  change: string;
  icon: string;
  label: string;
  points: DashboardSparkPointSeries;
  tone: Exclude<DashboardTone, "red">;
  value: string;
};

type DashboardCardMetaItem = {
  icon: string;
  value: string;
};

type DashboardChallengeCard = {
  anonymous?: boolean;
  companyInitials: string;
  companyLabel?: string;
  href: string;
  meta: DashboardCardMetaItem[];
  sectorLabel: string;
  sectorTone: DashboardTone;
  statusLabel: string;
  statusTone: DashboardTone;
  summary: string;
  title: string;
};

type DashboardSolutionCard = {
  engagementLabel: string;
  publicationLabel: string;
  publicationTone: DashboardTone;
  regionLabel: string;
  sectorLabel: string;
  sectorTone: DashboardTone;
  summary: string;
  title: string;
  votes: number;
};

type DashboardSectorProgress = {
  count: string;
  label: string;
  tone: DashboardTone;
  width: string;
};

type DashboardActivityFeedItem = {
  color: string;
  meta: string;
  text: string;
};

type DashboardReadiness = {
  footer: string;
  metric: string;
  note: string;
};

type DashboardSectorPill = {
  label: string;
  slug: string | null;
};

export type PublicDashboardViewModel = {
  activityFeed: DashboardActivityFeedItem[];
  heroStats: DashboardMetricDisplay[];
  heroText: string;
  readiness: DashboardReadiness;
  recentChallenges: DashboardChallengeCard[];
  recentSolutions: DashboardSolutionCard[];
  sectorPills: DashboardSectorPill[];
  sectorProgress: DashboardSectorProgress[];
  state: DashboardState;
  statCards: DashboardStatCard[];
};

type BuildPublicDashboardViewModelInput = {
  generatedAt: string;
  snapshot: DashboardSnapshot;
  source: DashboardSource;
};

function createDemoDashboardSnapshot(): DashboardSnapshot {
  const demo = createPublicDemoSnapshot();

  return {
    activitySignals: demo.signals,
    challenges: demo.challenges.slice(0, 4),
    metrics: demo.metrics,
    sectorActivity: demo.sectorActivity,
    solutions: demo.solutions.slice(0, 2),
  };
}

function isDashboardSnapshotEmpty(snapshot: DashboardSnapshot) {
  return (
    (snapshot.metrics?.publishedChallengeCount ?? 0) === 0 &&
    (snapshot.metrics?.publishedSolutionCount ?? 0) === 0 &&
    snapshot.activitySignals.length === 0
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatRelativeDate(
  input: string | null,
  referenceDate = new Date(),
): string {
  if (!input) {
    return "No recent activity";
  }

  const value = new Date(input);
  const diffInDays = Math.floor(
    (Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate(),
    ) -
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())) /
      86_400_000,
  );

  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  return value.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function resolveSectorTone(sectorName: string): DashboardTone {
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

function resolvePublicationTone(accessModel: PublicSolutionRecord["accessModel"]): DashboardTone {
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

function getChallengeStatus(
  challenge: PublicChallengeRecord,
): Pick<DashboardChallengeCard, "statusLabel" | "statusTone"> {
  if (challenge.linkedSolutionCount > 0) {
    return {
      statusLabel: "Matched",
      statusTone: "green",
    };
  }

  return {
    statusLabel: "Published",
    statusTone: "blue",
  };
}

function toChallengeCard(challenge: PublicChallengeRecord): DashboardChallengeCard {
  const status = getChallengeStatus(challenge);
  const anonymous = challenge.anonymityMode === "anonymous";
  const ownerLabel = anonymous ? "Anonymous" : challenge.companyName;

  return {
    anonymous,
    companyInitials: anonymous ? "👤" : getInitials(ownerLabel),
    companyLabel: anonymous ? undefined : ownerLabel,
    href: `/challenges/${challenge.slug}`,
    meta: [
      { icon: "💡", value: formatNumber(challenge.linkedSolutionCount) },
      { icon: "⏱", value: formatRelativeDate(challenge.publishedAt) },
      { icon: challenge.geographyLabel ? "📍" : "🌍", value: challenge.geographyLabel ?? "Public" },
    ],
    sectorLabel: challenge.sectorName,
    sectorTone: resolveSectorTone(challenge.sectorName),
    statusLabel: status.statusLabel,
    statusTone: status.statusTone,
    summary: challenge.summary,
    title: challenge.title,
  };
}

function toSolutionCard(solution: PublicSolutionRecord): DashboardSolutionCard {
  return {
    engagementLabel: `${solution.linkedChallengeCount} match${
      solution.linkedChallengeCount === 1 ? "" : "es"
    }`,
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

function getActivityColor(eventName: string) {
  if (eventName === "solution_published" || eventName === "challenge_resolved") {
    return "var(--green)";
  }

  if (eventName === "company_joined") {
    return "var(--gold)";
  }

  if (eventName === "ai_discovery") {
    return "var(--blue)";
  }

  return "var(--red)";
}

function toActivityText(item: PublicActivitySignalRecord) {
  if (item.eventName === "solution_published") {
    return `Solution posted — ${item.resourceLabel}`;
  }

  if (item.eventName === "challenge_published") {
    return `Challenge posted — ${item.resourceLabel}`;
  }

  if (item.eventName === "company_joined") {
    return `Company joined — ${item.resourceLabel}`;
  }

  if (item.eventName === "ai_discovery") {
    return `AI scenario — ${item.sectorName ?? item.resourceLabel}`;
  }

  if (item.eventName === "challenge_resolved") {
    return `Resolved — ${item.resourceLabel}`;
  }

  return item.resourceLabel;
}

function toActivityFeedItem(item: PublicActivitySignalRecord): DashboardActivityFeedItem {
  return {
    color: getActivityColor(item.eventName),
    meta: `${formatRelativeDate(item.occurredAt)} · ${item.actorLabel}${
      item.sectorName ? ` · ${item.sectorName}` : ""
    }`,
    text: toActivityText(item),
  };
}

function toSectorProgress(rows: PublicSectorActivityRecord[]): DashboardSectorProgress[] {
  const totals = rows.map((row) => ({
    label: row.sectorName,
    total: row.publishedChallengeCount + row.publishedSolutionCount,
  }));
  const maxTotal = Math.max(...totals.map((row) => row.total), 1);

  return totals.map((row) => ({
    count: formatNumber(row.total),
    label: row.label,
    tone: resolveSectorTone(row.label),
    width: `${Math.max(18, Math.round((row.total / maxTotal) * 85))}%`,
  }));
}

function buildSeriesFromValues(values: number[], targetLength = 6) {
  if (values.length === 0) {
    return Array.from({ length: targetLength }, () => 0);
  }

  if (values.length >= targetLength) {
    return values.slice(0, targetLength);
  }

  const firstValue = values[0] ?? 0;
  const padCount = targetLength - values.length;

  return [...Array.from({ length: padCount }, () => firstValue), ...values];
}

function buildRecentBucketSeries(
  timestamps: Array<string | null | undefined>,
  referenceDate: Date,
  bucketCount = 6,
) {
  const now = referenceDate.getTime();
  const bucketSize = 30 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: bucketCount }, () => 0);

  timestamps.forEach((timestamp) => {
    if (!timestamp) {
      return;
    }

    const value = new Date(timestamp).getTime();

    if (Number.isNaN(value) || value > now) {
      return;
    }

    const age = now - value;
    const bucketIndex = bucketCount - 1 - Math.floor(age / bucketSize);

    if (bucketIndex >= 0 && bucketIndex < bucketCount) {
      buckets[bucketIndex] += 1;
    }
  });

  return buckets;
}

function buildResolutionSeries(
  challenges: PublicChallengeRecord[],
  referenceDate: Date,
  bucketCount = 6,
) {
  const now = referenceDate.getTime();
  const bucketSize = 30 * 24 * 60 * 60 * 1000;
  const totals = Array.from({ length: bucketCount }, () => 0);
  const resolved = Array.from({ length: bucketCount }, () => 0);

  challenges.forEach((challenge) => {
    if (!challenge.publishedAt) {
      return;
    }

    const value = new Date(challenge.publishedAt).getTime();

    if (Number.isNaN(value) || value > now) {
      return;
    }

    const age = now - value;
    const bucketIndex = bucketCount - 1 - Math.floor(age / bucketSize);

    if (bucketIndex >= 0 && bucketIndex < bucketCount) {
      totals[bucketIndex] += 1;

      if (challenge.linkedSolutionCount > 0) {
        resolved[bucketIndex] += 1;
      }
    }
  });

  let lastKnownValue = 0;

  return totals.map((total, index) => {
    if (total === 0) {
      return lastKnownValue;
    }

    lastKnownValue = clampPercent((resolved[index]! / total) * 100);

    return lastKnownValue;
  });
}

function deriveResolutionRate(challenges: PublicChallengeRecord[]) {
  if (challenges.length === 0) {
    return 0;
  }

  const matchedChallenges = challenges.filter((challenge) => challenge.linkedSolutionCount > 0).length;

  return clampPercent((matchedChallenges / challenges.length) * 100);
}

function hasLiveContent(snapshot: DashboardSnapshot) {
  const metrics = snapshot.metrics;

  return Boolean(
    metrics &&
      (metrics.publishedChallengeCount > 0 ||
        metrics.publishedSolutionCount > 0 ||
        metrics.publicCompanyCount > 0 ||
        metrics.publicSignalCount > 0),
  );
}

function resolveState(source: DashboardSource, snapshot: DashboardSnapshot): DashboardState {
  if (source === "setup") {
    return "setup";
  }

  if (source === "error") {
    return "error";
  }

  return hasLiveContent(snapshot) ? "live" : "empty";
}

function createZeroMetrics(): PublicPlatformMetricsRecord {
  return {
    latestActivityAt: null,
    publicCompanyCount: 0,
    publicSignalCount: 0,
    publishedChallengeCount: 0,
    publishedSolutionCount: 0,
    visibleSectorCount: 0,
  };
}

function createReadiness(state: DashboardState): DashboardReadiness {
  if (state === "setup") {
    return {
      footer: "Ready to query the public-safe views as soon as Supabase credentials are present.",
      metric: "T07",
      note:
        "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load real dashboard data from the new public-safe views.",
    };
  }

  if (state === "error") {
    return {
      footer: "The page is wired for live data, but the view query path still needs verification in the target Supabase project.",
      metric: "T07",
      note:
        "The dashboard data layer is connected, but the public-safe views could not be loaded. Verify that the T04 and T06 migrations are applied in Supabase.",
    };
  }

  if (state === "empty") {
    return {
      footer: "The live query path is active and ready for published records to appear.",
      metric: "T07",
      note:
        "The dashboard is querying live public-safe views, but there are no published challenges, solutions, or activity signals yet.",
    };
  }

  return {
    footer: "Dashboard metrics, sector summaries, recent records, and activity now come from the T06 public-safe views.",
    metric: "T07",
    note:
      "This dashboard now reads from real public-safe Supabase views for metrics, sector activity, recent challenges, recent solutions, and live public signals.",
  };
}

export function buildPublicDashboardViewModel({
  generatedAt,
  snapshot,
  source,
}: BuildPublicDashboardViewModelInput): PublicDashboardViewModel {
  const referenceDate = new Date(generatedAt);
  const state = resolveState(source, snapshot);
  const metrics = snapshot.metrics ?? createZeroMetrics();
  const topSector = snapshot.sectorActivity[0]?.sectorName ?? "No sector activity yet";
  const resolutionRate = deriveResolutionRate(snapshot.challenges);
  const matchedChallenges = snapshot.challenges.filter(
    (challenge) => challenge.linkedSolutionCount > 0,
  ).length;
  const challengePoints = buildSeriesFromValues(
    buildRecentBucketSeries(
      snapshot.challenges.map((challenge) => challenge.publishedAt),
      referenceDate,
    ),
  );
  const solutionPoints = buildSeriesFromValues(
    buildRecentBucketSeries(
      snapshot.solutions.map((solution) => solution.publishedAt),
      referenceDate,
    ),
  );
  const companyPoints = buildSeriesFromValues(
    (() => {
      const joinedSeries = buildRecentBucketSeries(
        snapshot.activitySignals
          .filter((item) => item.eventName === "company_joined")
          .map((item) => item.occurredAt),
        referenceDate,
      );

      if (joinedSeries.some((value) => value > 0)) {
        return joinedSeries;
      }

      return snapshot.sectorActivity
        .map((row) => row.publishedChallengeCount + row.publishedSolutionCount)
        .slice(0, 6);
    })(),
  );
  const resolutionPoints = buildSeriesFromValues(
    buildResolutionSeries(snapshot.challenges, referenceDate),
  );

  return {
    activityFeed: snapshot.activitySignals.slice(0, 5).map(toActivityFeedItem),
    heroStats: [
      {
        label: "Challenges Posted",
        value: formatNumber(metrics.publishedChallengeCount),
      },
      {
        label: "Solutions Published",
        value: formatNumber(metrics.publishedSolutionCount),
      },
      {
        label: "Companies Active",
        value: formatNumber(metrics.publicCompanyCount),
      },
      {
        accent: "green",
        label: "Resolution Rate",
        value: `${resolutionRate}%`,
      },
    ],
    heroText:
      state === "live"
        ? "A national knowledge hub now powered by real public-safe platform records across challenges, solutions, sectors, and activity."
        : state === "empty"
          ? "The live dashboard query path is active and ready, with public-safe views waiting for the first published records."
          : state === "setup"
            ? "The dashboard is wired for real public-safe data and will light up as soon as Supabase credentials are configured."
            : "The dashboard composition is intact, but the live public-safe query layer needs attention before data can render.",
    readiness: createReadiness(state),
    recentChallenges: snapshot.challenges.slice(0, 4).map(toChallengeCard),
    recentSolutions: snapshot.solutions.slice(0, 2).map(toSolutionCard),
    sectorPills: [
      { label: "All", slug: null },
      ...snapshot.sectorActivity.slice(0, 5).map((row) => ({
        label: row.sectorName,
        slug: row.sectorSlug,
      })),
    ],
    sectorProgress: toSectorProgress(snapshot.sectorActivity.slice(0, 5)),
    state,
    statCards: [
      {
        change: `${formatNumber(metrics.visibleSectorCount)} governed sectors`,
        icon: "🏭",
        label: "Problems Registered",
        points: challengePoints,
        tone: "gold",
        value: formatNumber(metrics.publishedChallengeCount),
      },
      {
        change: `${topSector} leading sector`,
        icon: "💡",
        label: "Solutions Published",
        points: solutionPoints,
        tone: "green",
        value: formatNumber(metrics.publishedSolutionCount),
      },
      {
        change: "Public company profiles",
        icon: "🏢",
        label: "Active Companies",
        points: companyPoints,
        tone: "blue",
        value: formatNumber(metrics.publicCompanyCount),
      },
      {
        change: `${formatNumber(matchedChallenges)} matched challenges`,
        icon: "🤝",
        label: "Resolution Rate",
        points: resolutionPoints,
        tone: "green",
        value: `${resolutionRate}%`,
      },
    ],
  };
}

export const getPublicDashboardViewModel = cache(async () => {
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      return buildPublicDashboardViewModel({
        generatedAt: new Date().toISOString(),
        snapshot: createDemoDashboardSnapshot(),
        source: "live",
      });
    }

    return buildPublicDashboardViewModel({
      generatedAt: new Date().toISOString(),
      snapshot: {
        activitySignals: [],
        challenges: [],
        metrics: null,
        sectorActivity: [],
        solutions: [],
      },
      source: "setup",
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [
      metricsResult,
      challengesResult,
      solutionsResult,
      sectorActivityResult,
      activitySignalsResult,
    ] = await Promise.all([
      supabase.from("public_platform_metrics").select("*").maybeSingle(),
      supabase
        .from("public_challenges")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(4),
      supabase
        .from("public_solutions")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(2),
      supabase
        .from("public_sector_activity")
        .select("*")
        .order("published_challenge_count", { ascending: false })
        .order("published_solution_count", { ascending: false })
        .order("latest_publication_at", { ascending: false })
        .limit(6),
      supabase
        .from("public_activity_signals")
        .select("*")
        .order("occurred_at", { ascending: false })
        .limit(30),
    ]);

    const results = [
      metricsResult,
      challengesResult,
      solutionsResult,
      sectorActivityResult,
      activitySignalsResult,
    ];
    const firstError = results.find((result) => result.error);

    if (firstError?.error) {
      console.error("Failed to load public dashboard data", firstError.error);

      if (demoEnabled) {
        return buildPublicDashboardViewModel({
          generatedAt: new Date().toISOString(),
          snapshot: createDemoDashboardSnapshot(),
          source: "live",
        });
      }

      return buildPublicDashboardViewModel({
        generatedAt: new Date().toISOString(),
        snapshot: {
          activitySignals: [],
          challenges: [],
          metrics: null,
          sectorActivity: [],
          solutions: [],
        },
        source: "error",
      });
    }

    const snapshot = {
      activitySignals:
        ((activitySignalsResult.data ?? []) as Parameters<typeof mapPublicActivitySignalRow>[0][])
          .map(mapPublicActivitySignalRow),
      challenges: ((challengesResult.data ?? []) as Parameters<typeof mapPublicChallengeRow>[0][])
        .map(mapPublicChallengeRow),
      metrics:
        metricsResult.data === null
          ? null
          : mapPublicPlatformMetricsRow(
              metricsResult.data as Parameters<typeof mapPublicPlatformMetricsRow>[0],
            ),
      sectorActivity:
        ((sectorActivityResult.data ?? []) as Parameters<typeof mapPublicSectorActivityRow>[0][])
          .map(mapPublicSectorActivityRow),
      solutions: ((solutionsResult.data ?? []) as Parameters<typeof mapPublicSolutionRow>[0][])
        .map(mapPublicSolutionRow),
    } satisfies DashboardSnapshot;

    if (demoEnabled && isDashboardSnapshotEmpty(snapshot)) {
      return buildPublicDashboardViewModel({
        generatedAt: new Date().toISOString(),
        snapshot: createDemoDashboardSnapshot(),
        source: "live",
      });
    }

    return buildPublicDashboardViewModel({
      generatedAt: new Date().toISOString(),
      snapshot,
      source: "live",
    });
  } catch (error) {
    console.error("Unexpected dashboard query failure", error);

    if (demoEnabled) {
      return buildPublicDashboardViewModel({
        generatedAt: new Date().toISOString(),
        snapshot: createDemoDashboardSnapshot(),
        source: "live",
      });
    }

    return buildPublicDashboardViewModel({
      generatedAt: new Date().toISOString(),
      snapshot: {
        activitySignals: [],
        challenges: [],
        metrics: null,
        sectorActivity: [],
        solutions: [],
      },
      source: "error",
    });
  }
});
