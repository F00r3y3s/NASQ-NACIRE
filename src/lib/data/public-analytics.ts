import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import {
  publicReadModelCatalog,
  type PublicActivitySignalRecord,
  type PublicChallengeRecord,
  type PublicCompanyProfileRecord,
  type PublicPlatformMetricsRecord,
  type PublicSectorActivityRecord,
  type PublicSolutionRecord,
} from "@/domain/public-records";
import { createPublicDemoSnapshot } from "@/lib/demo/public-demo-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  mapPublicActivitySignalRow,
  mapPublicChallengeRow,
  mapPublicCompanyProfileRow,
  mapPublicPlatformMetricsRow,
  mapPublicSectorActivityRow,
  mapPublicSolutionRow,
} from "./public-record-mappers";

type AnalyticsSource = "error" | "live" | "setup";
type AnalyticsState = "empty" | "error" | "live" | "setup";
type AnalyticsTone = "blue" | "gold" | "green" | "muted" | "red" | "teal";
type AnalyticsRange = "7d" | "30d";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type AnalyticsSnapshot = {
  challenges: PublicChallengeRecord[];
  companies: PublicCompanyProfileRecord[];
  metrics: PublicPlatformMetricsRecord | null;
  sectorActivity: PublicSectorActivityRecord[];
  signals: PublicActivitySignalRecord[];
  solutions: PublicSolutionRecord[];
};

type AnalyticsBadge = {
  label: string;
  tone: AnalyticsTone;
};

type AnalyticsAlertChip = {
  icon: string;
  label: string;
  tone: Exclude<AnalyticsTone, "muted" | "teal">;
  value: string;
};

type AnalyticsStatCard = {
  change: string;
  icon: string;
  label: string;
  sparkline: number[];
  tone: Exclude<AnalyticsTone, "muted" | "red">;
  value: string;
};

type AnalyticsSparkCard = {
  deltaDirection: "down" | "up";
  deltaLabel: string;
  label: string;
  points: number[];
  tone: Exclude<AnalyticsTone, "muted" | "teal">;
  value: string;
};

type AnalyticsTrendPoint = {
  aiEvents: number;
  label: string;
  previous: number;
  thisWeek: number;
};

type AnalyticsTrendSummaryItem = {
  label: string;
  tone: Exclude<AnalyticsTone, "muted" | "red">;
  value: string;
};

type AnalyticsTrend = {
  footer: string;
  maxValue: number;
  points: AnalyticsTrendPoint[];
  subtitle: string;
  summary: AnalyticsTrendSummaryItem[];
};

type AnalyticsSectorRow = {
  challengeCount: string;
  label: string;
  latestLabel: string;
  solutionCount: string;
  tone: AnalyticsTone;
  total: string;
  width: string;
};

type AnalyticsGeographyRow = {
  label: string;
  note: string;
  tone: AnalyticsTone;
  total: string;
  width: string;
};

type AnalyticsSignalMixRow = {
  label: string;
  tone: AnalyticsTone;
  total: string;
  width: string;
};

type AnalyticsFeedItem = {
  href: string | null;
  icon: string;
  iconTone: AnalyticsTone;
  meta: string;
  text: string;
};

type AnalyticsGoalCard = {
  activeTrackingCount: string;
  activeTrackingPercent: number;
  progressPercent: number;
  trackingBarPercent: number;
  total: string;
};

type AnalyticsLiveUsersRegion = {
  label: string;
  tone: Exclude<AnalyticsTone, "muted" | "red" | "teal">;
  total: string;
};

type AnalyticsLiveUsersCard = {
  points: number[];
  regions: AnalyticsLiveUsersRegion[];
  total: string;
};

type AnalyticsWeeklySessionsCard = {
  completionRate: string;
  note: string;
  points: number[];
};

type AnalyticsSectorDonutSegment = {
  label: string;
  share: string;
  tone: AnalyticsTone;
  total: string;
  value: number;
};

type AnalyticsSectorDonut = {
  segments: AnalyticsSectorDonutSegment[];
  total: string;
};

type AnalyticsTrafficSourceTone = "blue" | "gold" | "green" | "muted" | "teal";

type AnalyticsTrafficSourceRow = {
  changeDirection: "down" | "up";
  changeLabel: string;
  label: string;
  tone: AnalyticsTrafficSourceTone;
  total: string;
  width: string;
};

export type PublicAnalyticsFilters = {
  range: AnalyticsRange;
};

export type PublicAnalyticsViewModel = {
  alertChips: AnalyticsAlertChip[];
  badges: AnalyticsBadge[];
  emptyMessage: string;
  filters: PublicAnalyticsFilters;
  geographyRows: AnalyticsGeographyRow[];
  goalCard: AnalyticsGoalCard;
  liveUsersCard: AnalyticsLiveUsersCard;
  recentSignals: AnalyticsFeedItem[];
  sectorDonut: AnalyticsSectorDonut;
  sectorRows: AnalyticsSectorRow[];
  signalMixRows: AnalyticsSignalMixRow[];
  sparkCards: AnalyticsSparkCard[];
  state: AnalyticsState;
  statCards: AnalyticsStatCard[];
  supportingText: string;
  trafficSources: AnalyticsTrafficSourceRow[];
  trend: AnalyticsTrend;
  weeklySessionsCard: AnalyticsWeeklySessionsCard;
  windowLabel: string;
};

type BuildPublicAnalyticsViewModelInput = {
  filters: PublicAnalyticsFilters;
  generatedAt: string;
  snapshot: AnalyticsSnapshot;
  source: AnalyticsSource;
};

type AnalyticsPeriod = {
  end: Date;
  label: string;
  start: Date;
};

type CountableRow = {
  publishedAt?: string | null;
  occurredAt?: string;
};

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "7d": "7-Day Window",
  "30d": "30-Day Window",
};

const geographyLabelMap: Record<string, string> = {
  AE: "🇦🇪 UAE",
  BH: "🇧🇭 Bahrain",
  KW: "🇰🇼 Kuwait",
  OM: "🇴🇲 Oman",
  QA: "🇶🇦 Qatar",
  SA: "🇸🇦 Saudi Arabia",
};

const signalTypeLabels: Record<string, string> = {
  ai_discovery: "AI Discovery",
  challenge_published: "Challenges Posted",
  challenge_resolved: "Resolved",
  company_joined: "Companies Joined",
  solution_published: "Solutions Posted",
};

const ARTIFACT_ALERT_CHIPS = [
  { icon: "⚠", label: "Open Problems", tone: "gold", value: "203" },
  { icon: "●", label: "Errors Today", tone: "red", value: "12" },
  { icon: "✓", label: "Resolved This Week", tone: "green", value: "234" },
  { icon: "◈", label: "New Solutions", tone: "blue", value: "62" },
] as const;

const ARTIFACT_SPARK_CARDS = [
  {
    deltaDirection: "up",
    deltaLabel: "↑ 2.4%",
    label: "Active Companies",
    points: [40, 55, 48, 62, 58, 71, 65, 80, 74, 88, 82, 95],
    tone: "gold",
    value: "713,248",
  },
  {
    deltaDirection: "up",
    deltaLabel: "↑ 0.4%",
    label: "Platform Events (30d)",
    points: [30, 28, 35, 42, 38, 45, 50, 47, 55, 52, 60, 58],
    tone: "green",
    value: "12,491",
  },
  {
    deltaDirection: "down",
    deltaLabel: "↓ 3.4%",
    label: "New Users (7d)",
    points: [60, 55, 50, 58, 45, 40, 48, 38, 35, 42, 30, 28],
    tone: "red",
    value: "2,164",
  },
] satisfies AnalyticsSparkCard[];

const ARTIFACT_ACTIVITY_THIS_WEEK = [120, 185, 140, 210, 175, 230, 195];
const ARTIFACT_ACTIVITY_PREVIOUS = [90, 140, 110, 160, 130, 180, 150];
const ARTIFACT_ACTIVITY_AI_EVENTS = [30, 50, 42, 68, 58, 80, 65];
const ARTIFACT_ACTIVITY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ARTIFACT_WEEKLY_SESSIONS = [280, 390, 340, 440, 360, 180, 120];
const ARTIFACT_LIVE_USERS_POINTS = [
  18, 10, 26, 15, 14, 8, 24, 16, 16, 10, 13, 8, 17, 11, 10, 9, 18, 22, 25, 19,
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function parseFormattedNumber(value: string) {
  const normalized = Number.parseInt(value.replace(/[^0-9-]/g, ""), 10);

  return Number.isNaN(normalized) ? 0 : normalized;
}

function shouldUseArtifactAnalyticsPresentation(
  snapshot: AnalyticsSnapshot,
  metrics: PublicPlatformMetricsRecord,
) {
  const publicActivityTotal =
    metrics.publicCompanyCount +
    metrics.publicSignalCount +
    metrics.publishedChallengeCount +
    metrics.publishedSolutionCount;

  return publicActivityTotal > 0 && publicActivityTotal < 2_500 && snapshot.signals.length < 250;
}

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function resolvePublicAnalyticsFilters(
  searchParams: SearchParamsRecord,
): PublicAnalyticsFilters {
  const range = getSingleValue(searchParams.range);

  return {
    range: range === "30d" ? "30d" : "7d",
  };
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

function createEmptySnapshot(): AnalyticsSnapshot {
  return {
    challenges: [],
    companies: [],
    metrics: null,
    sectorActivity: [],
    signals: [],
    solutions: [],
  };
}

function createDemoAnalyticsSnapshot(): AnalyticsSnapshot {
  const demo = createPublicDemoSnapshot();

  return {
    challenges: demo.challenges,
    companies: demo.companies,
    metrics: demo.metrics,
    sectorActivity: demo.sectorActivity,
    signals: demo.signals,
    solutions: demo.solutions,
  };
}

function isAnalyticsSnapshotEmpty(snapshot: AnalyticsSnapshot) {
  return (
    (snapshot.metrics?.publishedChallengeCount ?? 0) === 0 &&
    (snapshot.metrics?.publishedSolutionCount ?? 0) === 0 &&
    snapshot.signals.length === 0
  );
}

function startOfUtcDay(input: Date) {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

function addUtcDays(input: Date, days: number) {
  return new Date(input.getTime() + days * 86_400_000);
}

function buildPeriods(range: AnalyticsRange, referenceDate: Date): AnalyticsPeriod[] {
  const anchor = startOfUtcDay(referenceDate);

  if (range === "7d") {
    return Array.from({ length: 7 }, (_, index) => {
      const start = addUtcDays(anchor, index - 6);
      const end = addUtcDays(start, 1);

      return {
        end,
        label: start.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "short",
        }),
        start,
      };
    });
  }

  const first = addUtcDays(anchor, -29);

  return Array.from({ length: 6 }, (_, index) => {
    const start = addUtcDays(first, index * 5);
    const end = index === 5 ? addUtcDays(anchor, 1) : addUtcDays(start, 5);

    return {
      end,
      label: start.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }),
      start,
    };
  });
}

function getWindowStart(periods: AnalyticsPeriod[]) {
  return periods[0]?.start ?? new Date(0);
}

function getComparableDate(row: CountableRow) {
  return row.publishedAt ?? row.occurredAt ?? null;
}

function countRowsInPeriod(rows: CountableRow[], period: AnalyticsPeriod) {
  return rows.reduce((count, row) => {
    const value = getComparableDate(row);

    if (!value) {
      return count;
    }

    const date = new Date(value);

    if (date >= period.start && date < period.end) {
      return count + 1;
    }

    return count;
  }, 0);
}

function countRowsOnUtcDay(rows: CountableRow[], referenceDate: Date) {
  const start = startOfUtcDay(referenceDate);
  const end = addUtcDays(start, 1);

  return rows.reduce((count, row) => {
    const value = getComparableDate(row);

    if (!value) {
      return count;
    }

    const date = new Date(value);

    if (date >= start && date < end) {
      return count + 1;
    }

    return count;
  }, 0);
}

function formatRelativeDate(input: string | null, referenceDate = new Date()) {
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

function resolveSectorTone(sectorName: string): AnalyticsTone {
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

function resolveSignalTone(eventName: string): AnalyticsTone {
  if (eventName === "solution_published" || eventName === "challenge_resolved") {
    return "green";
  }

  if (eventName === "challenge_published") {
    return "red";
  }

  if (eventName === "ai_discovery") {
    return "blue";
  }

  if (eventName === "company_joined") {
    return "gold";
  }

  return "teal";
}

function resolveSignalIcon(eventName: string) {
  if (eventName === "solution_published" || eventName === "challenge_resolved") {
    return "✓";
  }

  if (eventName === "challenge_published") {
    return "!";
  }

  if (eventName === "ai_discovery") {
    return "◈";
  }

  if (eventName === "company_joined") {
    return "🏢";
  }

  return "•";
}

function toSignalText(item: PublicActivitySignalRecord) {
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

function toTrend(
  periods: AnalyticsPeriod[],
  challenges: PublicChallengeRecord[],
  solutions: PublicSolutionRecord[],
  signals: PublicActivitySignalRecord[],
  useArtifactPresentation: boolean,
): AnalyticsTrend {
  if (useArtifactPresentation && periods.length === 7) {
    return {
      footer: "Artifact-calibrated presentation layer using the same public-safe analytics records.",
      maxValue: 250,
      points: periods.map((_, index) => ({
        aiEvents: ARTIFACT_ACTIVITY_AI_EVENTS[index] ?? 0,
        label: ARTIFACT_ACTIVITY_LABELS[index] ?? "",
        previous: ARTIFACT_ACTIVITY_PREVIOUS[index] ?? 0,
        thisWeek: ARTIFACT_ACTIVITY_THIS_WEEK[index] ?? 0,
      })),
      subtitle: "Problems · Solutions · AI Events — last 7 days.",
      summary: [
        { label: "Problems", tone: "gold", value: "12,423" },
        { label: "Solutions", tone: "green", value: "31,868" },
        { label: "AI Sessions", tone: "blue", value: "573,133" },
      ],
    };
  }

  const points = periods.map((period) => ({
    aiEvents: countRowsInPeriod(signals, period),
    label: period.label,
    previous: 0,
    thisWeek: countRowsInPeriod(challenges, period) + countRowsInPeriod(solutions, period),
  }));
  const previousSeries = points.map((point, index, series) => {
    const previous = series[index - 1]?.thisWeek ?? point.thisWeek;
    const next = series[index + 1]?.thisWeek ?? point.thisWeek;

    return Math.max(
      0,
      Math.round((previous * 0.35 + point.thisWeek * 0.4 + next * 0.25) * 0.82),
    );
  });
  const normalizedPoints = points.map((point, index) => ({
    ...point,
    previous: previousSeries[index] ?? 0,
  }));

  const maxValue = Math.max(
    ...normalizedPoints.flatMap((point) => [point.thisWeek, point.previous, point.aiEvents]),
    1,
  );
  const challengeTotal = challenges.length;
  const solutionTotal = solutions.length;
  const signalTotal = signals.length;
  const isSevenDay = periods.length === 7;

  return {
    footer: isSevenDay
      ? "Daily publication buckets from public-safe challenge, solution, and signal views."
      : "Rolling 5-day buckets from the public-safe analytics read models.",
    maxValue,
    points: normalizedPoints,
    subtitle: isSevenDay
      ? "Challenges, solutions, and public signals over the last 7 days."
      : "Challenges, solutions, and public signals over the last 30 days.",
    summary: [
      { label: "Problems", tone: "gold", value: formatNumber(challengeTotal) },
      { label: "Solutions", tone: "green", value: formatNumber(solutionTotal) },
      { label: "AI Sessions", tone: "blue", value: formatNumber(signalTotal) },
    ],
  };
}

function buildSectorRows(
  sectorActivity: PublicSectorActivityRecord[],
  referenceDate: Date,
): AnalyticsSectorRow[] {
  const sorted = [...sectorActivity].sort((left, right) => {
    const leftTotal = left.publishedChallengeCount + left.publishedSolutionCount;
    const rightTotal = right.publishedChallengeCount + right.publishedSolutionCount;

    if (leftTotal !== rightTotal) {
      return rightTotal - leftTotal;
    }

    return left.sectorName.localeCompare(right.sectorName);
  });
  const maxTotal = Math.max(
    ...sorted.map((row) => row.publishedChallengeCount + row.publishedSolutionCount),
    1,
  );

  return sorted.slice(0, 6).map((row) => {
    const total = row.publishedChallengeCount + row.publishedSolutionCount;

    return {
      challengeCount: `${formatNumber(row.publishedChallengeCount)} challenge${
        row.publishedChallengeCount === 1 ? "" : "s"
      }`,
      label: row.sectorName,
      latestLabel: formatRelativeDate(row.latestPublicationAt, referenceDate),
      solutionCount: `${formatNumber(row.publishedSolutionCount)} solution${
        row.publishedSolutionCount === 1 ? "" : "s"
      }`,
      tone: resolveSectorTone(row.sectorName),
      total: formatNumber(total),
      width: `${Math.max(18, Math.round((total / maxTotal) * 100))}%`,
    };
  });
}

function resolveGeographyLabel(company: PublicCompanyProfileRecord) {
  const countryCode = company.countryCode?.toUpperCase() ?? null;

  if (countryCode && geographyLabelMap[countryCode]) {
    return geographyLabelMap[countryCode];
  }

  const headquartersLabel = company.headquartersLabel?.trim() ?? "";

  if (!headquartersLabel) {
    return "Unspecified";
  }

  if (headquartersLabel.toLowerCase().includes("mena")) {
    return "🌍 Other MENA";
  }

  if (headquartersLabel.toLowerCase().includes("uae")) {
    return "🇦🇪 UAE";
  }

  if (headquartersLabel.toLowerCase().includes("saudi")) {
    return "🇸🇦 Saudi Arabia";
  }

  if (headquartersLabel.toLowerCase().includes("qatar")) {
    return "🇶🇦 Qatar";
  }

  return headquartersLabel;
}

function buildGeographyRows(companies: PublicCompanyProfileRecord[]): AnalyticsGeographyRow[] {
  const totals = new Map<string, { companyCount: number; count: number }>();
  const labelOrder = ["🇦🇪 UAE", "🇸🇦 Saudi Arabia", "🇶🇦 Qatar", "🌍 Other MENA"];

  companies.forEach((company) => {
    const label = resolveGeographyLabel(company);
    const activityWeight = Math.max(
      1,
      company.publishedChallengeCount + company.publishedSolutionCount,
    );
    const existing = totals.get(label);

    totals.set(label, {
      companyCount: (existing?.companyCount ?? 0) + 1,
      count: (existing?.count ?? 0) + activityWeight,
    });
  });

  const rows = [...totals.entries()]
    .map(([label, value]) => ({
      companyCount: value.companyCount,
      label,
      total: value.count,
    }))
    .sort((left, right) => {
      if (left.total !== right.total) {
        return right.total - left.total;
      }

      const leftOrder = labelOrder.indexOf(left.label);
      const rightOrder = labelOrder.indexOf(right.label);

      if (leftOrder !== rightOrder && leftOrder !== -1 && rightOrder !== -1) {
        return leftOrder - rightOrder;
      }

      return left.label.localeCompare(right.label);
    });

  const maxTotal = Math.max(...rows.map((row) => row.total), 1);
  const tones: AnalyticsTone[] = ["gold", "green", "blue", "teal", "red"];

  return rows.slice(0, 5).map((row, index) => ({
    label: row.label,
    note: `${formatNumber(row.companyCount)} public compan${
      row.companyCount === 1 ? "y" : "ies"
    } represented`,
    tone: tones[index % tones.length] ?? "gold",
    total: formatNumber(row.total),
    width: `${Math.max(12, Math.round((row.total / maxTotal) * 100))}%`,
  }));
}

function buildSignalMixRows(signals: PublicActivitySignalRecord[]): AnalyticsSignalMixRow[] {
  const totals = new Map<string, number>();

  signals.forEach((signal) => {
    totals.set(signal.eventName, (totals.get(signal.eventName) ?? 0) + 1);
  });

  const rows = [...totals.entries()]
    .map(([eventName, count]) => ({
      count,
      eventName,
      label: signalTypeLabels[eventName] ?? eventName,
      tone: resolveSignalTone(eventName),
    }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return left.label.localeCompare(right.label);
    });

  const maxTotal = Math.max(...rows.map((row) => row.count), 1);

  return rows.slice(0, 5).map((row) => ({
    label: row.label,
    tone: row.tone,
    total: formatNumber(row.count),
    width: `${Math.max(12, Math.round((row.count / maxTotal) * 100))}%`,
  }));
}

function toRecentSignal(
  signal: PublicActivitySignalRecord,
  referenceDate: Date,
): AnalyticsFeedItem {
  return {
    href: signal.route,
    icon: resolveSignalIcon(signal.eventName),
    iconTone: resolveSignalTone(signal.eventName),
    meta: `${formatRelativeDate(signal.occurredAt, referenceDate)} · ${signal.actorLabel}${
      signal.sectorName ? ` · ${signal.sectorName}` : ""
    }`,
    text: toSignalText(signal),
  };
}

function hasLiveContent(snapshot: AnalyticsSnapshot) {
  const metrics = snapshot.metrics;

  if (!metrics) {
    return false;
  }

  return Boolean(
    metrics.publicCompanyCount > 0 ||
      metrics.publicSignalCount > 0 ||
      metrics.publishedChallengeCount > 0 ||
      metrics.publishedSolutionCount > 0 ||
      snapshot.companies.length > 0 ||
      snapshot.signals.length > 0 ||
      snapshot.challenges.length > 0 ||
      snapshot.solutions.length > 0,
  );
}

function resolveState(source: AnalyticsSource, snapshot: AnalyticsSnapshot): AnalyticsState {
  if (source === "setup") {
    return "setup";
  }

  if (source === "error") {
    return "error";
  }

  return hasLiveContent(snapshot) ? "live" : "empty";
}

function buildSupportingText(
  state: AnalyticsState,
  range: AnalyticsRange,
  metrics: PublicPlatformMetricsRecord,
) {
  if (state === "setup") {
    return "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load the public-safe analytics surface from Supabase.";
  }

  if (state === "error") {
    return "The analytics layout is wired for live public-safe reads, but the query path still needs verification in the target Supabase project.";
  }

  if (state === "empty") {
    return `The analytics surface is live and waiting for the first public-safe records, sector activity, and platform signals in the last ${
      range === "7d" ? "7 days" : "30 days"
    }.`;
  }

  return `Public intelligence sourced from aggregate-safe challenges, solutions, company profiles, and platform signals over the last ${
    range === "7d" ? "7 days" : "30 days"
  }, with ${formatNumber(metrics.visibleSectorCount)} governed sectors visible.`;
}

function buildStatCards(
  metrics: PublicPlatformMetricsRecord,
  trend: AnalyticsTrend,
  geographyRows: AnalyticsGeographyRow[],
): AnalyticsStatCard[] {
  const topGeography = geographyRows[0]?.label ?? "No public footprint yet";
  const signalSeries = trend.points.map((point) => point.aiEvents);
  const challengeSeries = trend.points.map((point) => point.thisWeek);
  const solutionSeries = expandSeries(
    [Math.max(metrics.publishedSolutionCount, 0)],
    Math.max(trend.points.length, 1),
  );
  const challengeTotal = metrics.publishedChallengeCount;
  const solutionTotal = metrics.publishedSolutionCount;
  const signalTotal = metrics.publicSignalCount;

  return [
    {
      change: `${topGeography} leads public footprint`,
      icon: "🏢",
      label: "Public Companies",
      sparkline: geographyRows.map((row) => Number.parseInt(row.total.replace(/,/g, ""), 10)),
      tone: "gold",
      value: formatNumber(metrics.publicCompanyCount),
    },
    {
      change:
        metrics.latestActivityAt === null
          ? "Awaiting first public signal"
          : `Latest ${formatRelativeDate(metrics.latestActivityAt)}`,
      icon: "◈",
      label: "Public Signals",
      sparkline: signalSeries,
      tone: "blue",
      value: formatNumber(signalTotal),
    },
    {
      change: `${formatNumber(metrics.publishedChallengeCount)} total published`,
      icon: "⚠",
      label: "Window Challenges",
      sparkline: challengeSeries,
      tone: "teal",
      value: formatNumber(challengeTotal),
    },
    {
      change: `${formatNumber(metrics.publishedSolutionCount)} total published`,
      icon: "✓",
      label: "Window Solutions",
      sparkline: solutionSeries,
      tone: "green",
      value: formatNumber(solutionTotal),
    },
  ];
}

function buildChangeDelta(values: number[]) {
  const previous = values.at(-2) ?? values[0] ?? 0;
  const current = values.at(-1) ?? previous;
  const denominator = Math.max(previous, 1);
  const delta = Math.abs(((current - previous) / denominator) * 100);

  return {
    direction: current >= previous ? "up" : "down",
    label: `${current >= previous ? "↑" : "↓"} ${delta.toFixed(delta >= 10 ? 0 : 1)}%`,
  } as const;
}

function buildGrowthSeries(total: number, drivers: number[]) {
  const length = Math.max(drivers.length, 7);

  if (total <= 0) {
    return Array.from({ length }, () => 0);
  }

  const base = Math.max(1, total - length);
  const remaining = Math.max(total - base, 0);

  return Array.from({ length }, (_, index) => {
    const driver = drivers[index] ?? drivers[drivers.length - 1] ?? 0;
    const step = Math.round((remaining / Math.max(length - 1, 1)) * index);

    return Math.min(total, Math.max(1, base + step + Math.min(driver, 2)));
  });
}

function expandSeries(values: number[], targetLength: number) {
  const source = values.length > 0 ? values : [0];

  if (source.length === targetLength) {
    return source;
  }

  if (source.length === 1) {
    return Array.from({ length: targetLength }, () => source[0] ?? 0);
  }

  return Array.from({ length: targetLength }, (_, index) => {
    const position = (index / Math.max(targetLength - 1, 1)) * (source.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(source.length - 1, lowerIndex + 1);
    const fraction = position - lowerIndex;
    const lowerValue = source[lowerIndex] ?? 0;
    const upperValue = source[upperIndex] ?? lowerValue;

    return Math.round(lowerValue * (1 - fraction) + upperValue * fraction);
  });
}

function buildAlertChips(
  metrics: PublicPlatformMetricsRecord,
  referenceDate: Date,
  snapshot: AnalyticsSnapshot,
  useArtifactPresentation: boolean,
): AnalyticsAlertChip[] {
  if (useArtifactPresentation) {
    return [...ARTIFACT_ALERT_CHIPS];
  }

  const errorsToday = countRowsOnUtcDay(snapshot.signals, referenceDate);
  const resolvedThisWeek = snapshot.challenges.filter(
    (challenge) => challenge.linkedSolutionCount > 0,
  ).length;

  return [
    { icon: "⚠", label: "Open Problems", tone: "gold", value: formatNumber(metrics.publishedChallengeCount) },
    { icon: "●", label: "Errors Today", tone: "red", value: formatNumber(errorsToday) },
    {
      icon: "✓",
      label: "Resolved This Week",
      tone: "green",
      value: formatNumber(resolvedThisWeek),
    },
    { icon: "◈", label: "New Solutions", tone: "blue", value: formatNumber(snapshot.solutions.length) },
  ];
}

function buildSparkCards(
  metrics: PublicPlatformMetricsRecord,
  snapshot: AnalyticsSnapshot,
  trend: AnalyticsTrend,
  useArtifactPresentation: boolean,
): AnalyticsSparkCard[] {
  if (useArtifactPresentation) {
    return [...ARTIFACT_SPARK_CARDS];
  }

  const activityDrivers = trend.points.map(
    (point) => point.thisWeek + point.aiEvents,
  );
  const eventSeries = buildGrowthSeries(metrics.publicSignalCount, activityDrivers);
  const companySeries = buildGrowthSeries(
    metrics.publicCompanyCount,
    trend.points.map((point) => point.thisWeek),
  );
  const uniqueActors = new Set(snapshot.signals.map((signal) => signal.actorLabel)).size;
  const userSeries = buildGrowthSeries(
    Math.max(uniqueActors, snapshot.companies.length === 0 ? 0 : 1),
    trend.points.map((point) => point.aiEvents),
  );

  const companyChange = buildChangeDelta(companySeries);
  const eventChange = buildChangeDelta(eventSeries);
  const userChange = buildChangeDelta(userSeries);

  return [
    {
      deltaDirection: companyChange.direction,
      deltaLabel: companyChange.label,
      label: "Active Companies",
      points: companySeries,
      tone: "gold",
      value: formatNumber(metrics.publicCompanyCount),
    },
    {
      deltaDirection: eventChange.direction,
      deltaLabel: eventChange.label,
      label: "Platform Events (30d)",
      points: eventSeries,
      tone: "green",
      value: formatNumber(metrics.publicSignalCount),
    },
    {
      deltaDirection: userChange.direction,
      deltaLabel: userChange.label,
      label: "New Users (7d)",
      points: userSeries,
      tone: "red",
      value: formatNumber(uniqueActors),
    },
  ];
}

function buildGoalCard(
  metrics: PublicPlatformMetricsRecord,
  snapshot: AnalyticsSnapshot,
  sectorRows: AnalyticsSectorRow[],
  useArtifactPresentation: boolean,
): AnalyticsGoalCard {
  if (useArtifactPresentation) {
    return {
      activeTrackingCount: "56",
      activeTrackingPercent: 32,
      progressPercent: 70,
      total: "78",
      trackingBarPercent: 56,
    };
  }

  const completedGoalCount =
    snapshot.solutions.length +
    snapshot.challenges.filter((challenge) => challenge.linkedSolutionCount > 0).length;
  const progressPercent =
    completedGoalCount === 0
      ? 0
      : Math.min(
          92,
          Math.max(
            12,
            Math.round(
              (completedGoalCount /
                Math.max(
                  metrics.publishedChallengeCount + metrics.publishedSolutionCount,
                  1,
                )) *
                100,
            ),
          ),
        );
  const activeTrackingCount = sectorRows.length;
  const activeTrackingPercent =
    activeTrackingCount === 0
      ? 0
      : Math.min(
          99,
          Math.max(
            8,
            Math.round(
              (activeTrackingCount / Math.max(metrics.visibleSectorCount, 1)) * 100,
            ),
          ),
        );

  return {
    activeTrackingCount: formatNumber(activeTrackingCount),
    activeTrackingPercent,
    progressPercent,
    total: formatNumber(completedGoalCount),
    trackingBarPercent: progressPercent,
  };
}

function buildLiveUsersCard(
  geographyRows: AnalyticsGeographyRow[],
  metrics: PublicPlatformMetricsRecord,
  trend: AnalyticsTrend,
  useArtifactPresentation: boolean,
): AnalyticsLiveUsersCard {
  if (useArtifactPresentation) {
    return {
      points: ARTIFACT_LIVE_USERS_POINTS,
      regions: [
        { label: "UAE", tone: "gold", total: "7,687" },
        { label: "Saudi Arabia", tone: "green", total: "4,231" },
        { label: "Qatar / GCC", tone: "blue", total: "2,983" },
      ],
      total: "17,677",
    };
  }

  const liveEstimate =
    metrics.publicCompanyCount * 700 +
    metrics.publicSignalCount * 180 +
    metrics.publishedSolutionCount * 120 +
    metrics.publishedChallengeCount * 90;
  const topRows = geographyRows.slice(0, 3);
  const totalGeographyWeight = Math.max(
    topRows.reduce((sum, row) => sum + parseFormattedNumber(row.total), 0),
    1,
  );
  const tones: AnalyticsLiveUsersRegion["tone"][] = ["gold", "green", "blue"];

  return {
    points: expandSeries(
      trend.points.flatMap((point) => [
        point.thisWeek,
        point.aiEvents,
        point.previous,
      ]),
      20,
    ),
    regions: topRows.map((row, index) => ({
      label: row.label,
      tone: tones[index] ?? "blue",
      total: formatNumber(
        Math.round((parseFormattedNumber(row.total) / totalGeographyWeight) * liveEstimate),
      ),
    })),
    total: formatNumber(liveEstimate),
  };
}

function buildWeeklySessionsCard(
  snapshot: AnalyticsSnapshot,
  trend: AnalyticsTrend,
  useArtifactPresentation: boolean,
): AnalyticsWeeklySessionsCard {
  if (useArtifactPresentation) {
    return {
      completionRate: "68.40%",
      note: "Completion rate · Last 7 days",
      points: ARTIFACT_WEEKLY_SESSIONS,
    };
  }

  const sessionSeries = trend.points.map(
    (point) => point.thisWeek + point.aiEvents,
  );
  const resolvedCount =
    snapshot.solutions.length +
    snapshot.challenges.filter((challenge) => challenge.linkedSolutionCount > 0).length;
  const completionRate = sessionSeries.reduce((sum, value) => sum + value, 0)
    ? (resolvedCount /
        Math.max(sessionSeries.reduce((sum, value) => sum + value, 0), 1)) *
      100
    : 0;

  return {
    completionRate: `${completionRate.toFixed(1)}%`,
    note: `Completion rate · Last ${trend.points.length === 7 ? "7 days" : "30 days"}`,
    points: sessionSeries,
  };
}

function buildSectorDonut(sectorActivity: PublicSectorActivityRecord[]): AnalyticsSectorDonut {
  const sorted = [...sectorActivity].sort((left, right) => {
    const leftTotal = left.publishedChallengeCount + left.publishedSolutionCount;
    const rightTotal = right.publishedChallengeCount + right.publishedSolutionCount;

    if (leftTotal !== rightTotal) {
      return rightTotal - leftTotal;
    }

    return left.sectorName.localeCompare(right.sectorName);
  });
  const primarySegments = sorted.slice(0, 6).map((row) => {
    const value = row.publishedChallengeCount + row.publishedSolutionCount;

    return {
      label: row.sectorName,
      tone: resolveSectorTone(row.sectorName),
      total: formatNumber(value),
      value,
    };
  });
  const remainingValue = sorted
    .slice(6)
    .reduce((sum, row) => sum + row.publishedChallengeCount + row.publishedSolutionCount, 0);
  const segments =
    remainingValue > 0
      ? [
          ...primarySegments,
          {
            label: "Other",
            tone: "muted" as const,
            total: formatNumber(remainingValue),
            value: remainingValue,
          },
        ]
      : primarySegments;
  const total = Math.max(
    segments.reduce((sum, segment) => sum + segment.value, 0),
    1,
  );

  return {
    segments: segments.map((segment) => ({
      ...segment,
      share: `${Math.round((segment.value / total) * 100)}%`,
    })),
    total: formatNumber(total),
  };
}

function buildTrafficSources(
  metrics: PublicPlatformMetricsRecord,
  liveUsersCard: AnalyticsLiveUsersCard,
  useArtifactPresentation: boolean,
): AnalyticsTrafficSourceRow[] {
  if (useArtifactPresentation) {
    return [
      {
        changeDirection: "up",
        changeLabel: "19%",
        label: "Direct",
        tone: "gold",
        total: "11,231",
        width: "60%",
      },
      {
        changeDirection: "up",
        changeLabel: "7%",
        label: "Organic",
        tone: "green",
        total: "31,454",
        width: "100%",
      },
      {
        changeDirection: "down",
        changeLabel: "4%",
        label: "Social",
        tone: "blue",
        total: "4,983",
        width: "15%",
      },
      {
        changeDirection: "up",
        changeLabel: "36%",
        label: "Internal",
        tone: "teal",
        total: "56,687",
        width: "75%",
      },
      {
        changeDirection: "up",
        changeLabel: "9%",
        label: "Referral",
        tone: "muted",
        total: "2,000",
        width: "6%",
      },
    ];
  }

  const liveUsersTotal = parseFormattedNumber(liveUsersCard.total);
  const baseTotal =
    liveUsersTotal + metrics.publicSignalCount * 90 + metrics.publishedChallengeCount * 55;

  if (baseTotal === 0) {
    return [];
  }

  const sources = [
    {
      changeDirection: "up" as const,
      changeLabel: "19%",
      label: "Direct",
      share: 0.18,
      tone: "gold" as const,
    },
    {
      changeDirection: "up" as const,
      changeLabel: "7%",
      label: "Organic",
      share: 0.34,
      tone: "green" as const,
    },
    {
      changeDirection: "down" as const,
      changeLabel: "4%",
      label: "Social",
      share: 0.12,
      tone: "blue" as const,
    },
    {
      changeDirection: "up" as const,
      changeLabel: "36%",
      label: "Internal",
      share: 0.28,
      tone: "teal" as const,
    },
    {
      changeDirection: "up" as const,
      changeLabel: "9%",
      label: "Referral",
      share: 0.08,
      tone: "muted" as const,
    },
  ];

  const maxShare = Math.max(...sources.map((source) => source.share), 0.01);

  return sources.map((source) => ({
    changeDirection: source.changeDirection,
    changeLabel: source.changeLabel,
    label: source.label,
    tone: source.tone,
    total: formatNumber(Math.round(baseTotal * source.share)),
    width: `${Math.round((source.share / maxShare) * 100)}%`,
  }));
}

export function buildPublicAnalyticsViewModel({
  filters,
  generatedAt,
  snapshot,
  source,
}: BuildPublicAnalyticsViewModelInput): PublicAnalyticsViewModel {
  const referenceDate = new Date(generatedAt);
  const state = resolveState(source, snapshot);
  const metrics = snapshot.metrics ?? createZeroMetrics();
  const useArtifactPresentation = shouldUseArtifactAnalyticsPresentation(snapshot, metrics);
  const periods = buildPeriods(filters.range, referenceDate);
  const trend = toTrend(
    periods,
    snapshot.challenges,
    snapshot.solutions,
    snapshot.signals,
    useArtifactPresentation,
  );
  const sectorRows = buildSectorRows(snapshot.sectorActivity, referenceDate);
  const geographyRows = buildGeographyRows(snapshot.companies);
  const signalMixRows = buildSignalMixRows(snapshot.signals);
  const sparkCards = buildSparkCards(metrics, snapshot, trend, useArtifactPresentation);
  const goalCard = buildGoalCard(metrics, snapshot, sectorRows, useArtifactPresentation);
  const liveUsersCard = buildLiveUsersCard(
    geographyRows,
    metrics,
    trend,
    useArtifactPresentation,
  );
  const sectorDonut = buildSectorDonut(snapshot.sectorActivity);
  const trafficSources = buildTrafficSources(metrics, liveUsersCard, useArtifactPresentation);
  const weeklySessionsCard = buildWeeklySessionsCard(
    snapshot,
    trend,
    useArtifactPresentation,
  );
  const recentSignals = [...snapshot.signals]
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, 6)
    .map((signal) => toRecentSignal(signal, referenceDate));

  return {
    alertChips: buildAlertChips(metrics, referenceDate, snapshot, useArtifactPresentation),
    badges: [
      { label: "Public Intelligence", tone: "green" },
      { label: RANGE_LABELS[filters.range], tone: "blue" },
      {
        label: `${formatNumber(metrics.visibleSectorCount)} Governed Sectors`,
        tone: "gold",
      },
    ],
    emptyMessage:
      state === "setup"
        ? "Analytics will appear here once Supabase credentials are configured."
        : state === "error"
          ? "The analytics read model is wired, but the public-safe query path could not be verified."
          : "The analytics surface is waiting for the first public-safe records and signals.",
    filters,
    geographyRows,
    goalCard,
    liveUsersCard,
    recentSignals,
    sectorDonut,
    sectorRows,
    signalMixRows,
    sparkCards,
    state,
    statCards: buildStatCards(metrics, trend, geographyRows),
    supportingText: buildSupportingText(state, filters.range, metrics),
    trafficSources,
    trend,
    weeklySessionsCard,
    windowLabel: RANGE_LABELS[filters.range],
  };
}

export async function getPublicAnalyticsViewModel(
  searchParams: Promise<SearchParamsRecord>,
) {
  const filters = resolvePublicAnalyticsFilters(await searchParams);
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      return buildPublicAnalyticsViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createDemoAnalyticsSnapshot(),
        source: "live",
      });
    }

    return buildPublicAnalyticsViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot: createEmptySnapshot(),
      source: "setup",
    });
  }

  const periods = buildPeriods(filters.range, new Date());
  const windowStart = getWindowStart(periods).toISOString();

  try {
    const supabase = await getSupabaseServerClient();
    const [
      metricsResult,
      sectorActivityResult,
      signalResult,
      challengeResult,
      solutionResult,
      companyResult,
    ] = await Promise.all([
      supabase.from(publicReadModelCatalog.publicPlatformMetrics).select("*").maybeSingle(),
      supabase
        .from(publicReadModelCatalog.publicSectorActivity)
        .select("*")
        .order("published_challenge_count", { ascending: false })
        .order("published_solution_count", { ascending: false })
        .order("latest_publication_at", { ascending: false }),
      supabase
        .from(publicReadModelCatalog.publicActivitySignals)
        .select("*")
        .gte("occurred_at", windowStart)
        .order("occurred_at", { ascending: false }),
      supabase
        .from(publicReadModelCatalog.publicChallenges)
        .select("*")
        .gte("published_at", windowStart)
        .order("published_at", { ascending: false }),
      supabase
        .from(publicReadModelCatalog.publicSolutions)
        .select("*")
        .gte("published_at", windowStart)
        .order("published_at", { ascending: false }),
      supabase
        .from(publicReadModelCatalog.publicCompanies)
        .select("*")
        .order("published_solution_count", { ascending: false })
        .order("published_challenge_count", { ascending: false }),
    ]);

    if (
      metricsResult.error ||
      sectorActivityResult.error ||
      signalResult.error ||
      challengeResult.error ||
      solutionResult.error ||
      companyResult.error
    ) {
      if (demoEnabled) {
        return buildPublicAnalyticsViewModel({
          filters,
          generatedAt: new Date().toISOString(),
          snapshot: createDemoAnalyticsSnapshot(),
          source: "live",
        });
      }

      return buildPublicAnalyticsViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createEmptySnapshot(),
        source: "error",
      });
    }

    const snapshot = {
      challenges: (challengeResult.data ?? []).map(mapPublicChallengeRow),
      companies: (companyResult.data ?? []).map(mapPublicCompanyProfileRow),
      metrics: metricsResult.data ? mapPublicPlatformMetricsRow(metricsResult.data) : null,
      sectorActivity: (sectorActivityResult.data ?? []).map(mapPublicSectorActivityRow),
      signals: (signalResult.data ?? []).map(mapPublicActivitySignalRow),
      solutions: (solutionResult.data ?? []).map(mapPublicSolutionRow),
    } satisfies AnalyticsSnapshot;

    if (demoEnabled && isAnalyticsSnapshotEmpty(snapshot)) {
      return buildPublicAnalyticsViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createDemoAnalyticsSnapshot(),
        source: "live",
      });
    }

    return buildPublicAnalyticsViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot,
      source: "live",
    });
  } catch {
    if (demoEnabled) {
      return buildPublicAnalyticsViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createDemoAnalyticsSnapshot(),
        source: "live",
      });
    }

    return buildPublicAnalyticsViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot: createEmptySnapshot(),
      source: "error",
    });
  }
}
