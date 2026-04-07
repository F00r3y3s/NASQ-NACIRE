import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import { publicReadModelCatalog, type PublicChallengeRecord, type PublicSectorActivityRecord, type PublicSectorRecord } from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";
import { createPublicDemoSnapshot } from "@/lib/demo/public-demo-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  mapPublicChallengeRow,
  mapPublicSectorActivityRow,
  mapPublicSectorRow,
} from "./public-record-mappers";

type BrowseSource = "error" | "live" | "setup";
type BrowseState = "empty" | "error" | "live" | "setup";
type BrowseTone = "blue" | "gold" | "green" | "red" | "teal";
export type ChallengeBrowseSort = "latest" | "oldest" | "matches";
export type ChallengeBrowseStatus = "all" | "open" | "solved";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type BrowseSnapshot = {
  challenges: PublicChallengeRecord[];
  sectorActivity: PublicSectorActivityRecord[];
  sectors: PublicSectorRecord[];
  totalCount: number;
};

export const PAGE_SIZE = 6;

export type PublicChallengesBrowseFilters = {
  page: number;
  query: string;
  sectorSlug: string | null;
  sort: ChallengeBrowseSort;
  status: ChallengeBrowseStatus;
};

type BrowseBadge = {
  label: string;
  tone: BrowseTone;
};

type BrowseQuickFilter = {
  active: boolean;
  label: string;
  priority: boolean;
  resultCount: number;
  slug: string | null;
};

type BrowseSectorOption = {
  active: boolean;
  label: string;
  resultCount: number;
  slug: string;
};

type BrowseSortOption = {
  active: boolean;
  label: string;
  value: ChallengeBrowseSort;
};

type BrowseStatusOption = {
  active: boolean;
  label: string;
  value: ChallengeBrowseStatus;
};

type BrowseStat = {
  label: string;
  value: string;
};

type BrowseChallengeCard = {
  anonymous?: boolean;
  companyLabel?: string;
  href: string;
  id: string;
  meta: string[];
  sectorLabel: string;
  sectorTone: BrowseTone;
  statusLabel: string;
  statusTone: BrowseTone;
  summary: string;
  title: string;
};

type BrowsePaginationLink = {
  active: boolean;
  href: string;
  label: string;
};

type BrowsePagination = {
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextHref: string | null;
  pageCount: number;
  pages: BrowsePaginationLink[];
  previousHref: string | null;
};

export type PublicChallengesBrowseViewModel = {
  badges: BrowseBadge[];
  cards: BrowseChallengeCard[];
  emptyMessage: string;
  filters: PublicChallengesBrowseFilters;
  statusOptions: BrowseStatusOption[];
  pagination: BrowsePagination;
  quickFilters: BrowseQuickFilter[];
  resultSummary: string;
  sectorOptions: BrowseSectorOption[];
  sortOptions: BrowseSortOption[];
  state: BrowseState;
  stats: BrowseStat[];
  supportingText: string;
};

type BuildPublicChallengesBrowseViewModelInput = {
  filters: PublicChallengesBrowseFilters;
  generatedAt: string;
  snapshot: BrowseSnapshot;
  source: BrowseSource;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearchQuery(value: string) {
  return value
    .trim()
    .replace(/[,%_()]+/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function normalizeSectorSlug(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const allowedSlugs = new Set(sectorSeeds.map((sector) => sector.slug));

  return allowedSlugs.has(normalizedValue) ? normalizedValue : null;
}

function resolveSort(value: string): ChallengeBrowseSort {
  if (value === "oldest" || value === "matches") {
    return value;
  }

  return "latest";
}

function resolveStatus(value: string): ChallengeBrowseStatus {
  if (value === "open" || value === "solved") {
    return value;
  }

  return "all";
}

function resolvePage(value: string) {
  const page = Number.parseInt(value, 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function resolveSectorTone(sectorName: string): BrowseTone {
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

function formatGeographyLabel(geographyLabel: string | null) {
  if (!geographyLabel) {
    return "🌍 Public";
  }

  if (geographyLabel.toLowerCase().includes("global")) {
    return `🌍 ${geographyLabel}`;
  }

  return `📍 ${geographyLabel}`;
}

function createFallbackSectors(): PublicSectorRecord[] {
  return sectorSeeds.map((sector) => ({
    description: sector.description,
    displayOrder: sector.displayOrder,
    iconKey: sector.iconKey,
    id: sector.slug,
    name: sector.name,
    slug: sector.slug,
  }));
}

function createEmptySnapshot(): BrowseSnapshot {
  return {
    challenges: [],
    sectorActivity: [],
    sectors: [],
    totalCount: 0,
  };
}

function matchesChallengeQuery(challenge: PublicChallengeRecord, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  const searchableValues = [
    challenge.title,
    challenge.summary,
    challenge.problemStatement,
    challenge.companyName,
    challenge.sectorName,
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function matchesChallengeStatus(
  challenge: PublicChallengeRecord,
  status: ChallengeBrowseStatus,
) {
  if (status === "open") {
    return challenge.linkedSolutionCount === 0;
  }

  if (status === "solved") {
    return challenge.linkedSolutionCount > 0;
  }

  return true;
}

function sortChallenges(
  challenges: PublicChallengeRecord[],
  sort: ChallengeBrowseSort,
) {
  return [...challenges].sort((left, right) => {
    if (sort === "matches") {
      if (right.linkedSolutionCount !== left.linkedSolutionCount) {
        return right.linkedSolutionCount - left.linkedSolutionCount;
      }
    } else if (sort === "oldest") {
      return (left.publishedAt ?? "").localeCompare(right.publishedAt ?? "");
    }

    return (right.publishedAt ?? "").localeCompare(left.publishedAt ?? "");
  });
}

function buildDemoChallengesBrowseViewModel(filters: PublicChallengesBrowseFilters) {
  const demo = createPublicDemoSnapshot();
  const filteredChallenges = sortChallenges(
    demo.challenges.filter((challenge) => {
      const matchesSector = filters.sectorSlug
        ? challenge.sectorSlug === filters.sectorSlug
        : true;

      return (
        matchesSector &&
        matchesChallengeQuery(challenge, filters.query) &&
        matchesChallengeStatus(challenge, filters.status)
      );
    }),
    filters.sort,
  );
  const totalCount = filteredChallenges.length;
  const safePage = Math.min(filters.page, Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  return buildPublicChallengesBrowseViewModel({
    filters: { ...filters, page: safePage },
    generatedAt: new Date().toISOString(),
    snapshot: {
      challenges: filteredChallenges.slice(from, to),
      sectorActivity: demo.sectorActivity,
      sectors: demo.sectors,
      totalCount,
    },
    source: "live",
  });
}

function buildSearchPattern(query: string) {
  if (!query) {
    return null;
  }

  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return null;
  }

  const pattern = `%${normalizedQuery}%`;

  return [
    `title.ilike.${pattern}`,
    `summary.ilike.${pattern}`,
    `problem_statement.ilike.${pattern}`,
    `company_name.ilike.${pattern}`,
    `sector_name.ilike.${pattern}`,
  ].join(",");
}

function getStatus(linkedSolutionCount: number) {
  if (linkedSolutionCount > 0) {
    return {
      label: "Solved",
      tone: "green" as const,
    };
  }

  return {
    label: "Open",
    tone: "red" as const,
  };
}

function toChallengeCard(
  challenge: PublicChallengeRecord,
  referenceDate: Date,
): BrowseChallengeCard {
  const anonymous = challenge.anonymityMode === "anonymous";
  const status = getStatus(challenge.linkedSolutionCount);

  return {
    anonymous,
    companyLabel: anonymous ? undefined : challenge.companyName,
    href: `/challenges/${challenge.slug}`,
    id: challenge.id,
    meta: [
      `💡 ${challenge.linkedSolutionCount}`,
      formatGeographyLabel(challenge.geographyLabel),
      `⏱ ${formatRelativeDate(challenge.publishedAt, referenceDate)}`,
    ],
    sectorLabel: challenge.sectorName,
    sectorTone: resolveSectorTone(challenge.sectorName),
    statusLabel: status.label,
    statusTone: status.tone,
    summary: challenge.summary,
    title: challenge.title,
  };
}

function resolveState(source: BrowseSource, totalCount: number): BrowseState {
  if (source === "setup") {
    return "setup";
  }

  if (source === "error") {
    return "error";
  }

  return totalCount > 0 ? "live" : "empty";
}

function buildPagination(
  filters: PublicChallengesBrowseFilters,
  totalCount: number,
): BrowsePagination {
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(filters.page, pageCount);
  const pageWindowStart = Math.max(1, currentPage - 2);
  const pageWindowEnd = Math.min(pageCount, pageWindowStart + 4);
  const pages: BrowsePaginationLink[] = [];

  for (let page = pageWindowStart; page <= pageWindowEnd; page += 1) {
    pages.push({
      active: page === currentPage,
      href: buildChallengesBrowseHref({ ...filters, page }),
      label: String(page),
    });
  }

  return {
    currentPage,
    hasNextPage: currentPage < pageCount,
    hasPreviousPage: currentPage > 1,
    nextHref:
      currentPage < pageCount ? buildChallengesBrowseHref({ ...filters, page: currentPage + 1 }) : null,
    pageCount,
    pages,
    previousHref:
      currentPage > 1 ? buildChallengesBrowseHref({ ...filters, page: currentPage - 1 }) : null,
  };
}

function buildResultSummary(
  filters: PublicChallengesBrowseFilters,
  totalCount: number,
  pagination: BrowsePagination,
) {
  if (totalCount === 0) {
    return "Showing 0 published challenges";
  }

  const start = (pagination.currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(totalCount, start + PAGE_SIZE - 1);

  const statusLabel =
    filters.status === "open"
      ? "open"
      : filters.status === "solved"
        ? "solved"
        : "published";

  return `Showing ${start}-${end} of ${formatNumber(totalCount)} ${statusLabel} challenges`;
}

function buildSupportingText(
  state: BrowseState,
  filters: PublicChallengesBrowseFilters,
  selectedSectorName: string | null,
) {
  if (state === "setup") {
    return "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load published challenge browse results from Supabase.";
  }

  if (state === "error") {
    return "The browse surface is wired to live public views, but the query path could not load. Verify the T04 and T06 migrations in Supabase.";
  }

  if (state === "empty") {
    if (filters.query || selectedSectorName || filters.status !== "all") {
      return "No published challenges match the current search, sector, and status filters. Reset the filters to broaden discovery.";
    }

    return "The browse view is live, but there are no published challenges available yet.";
  }

  if (filters.query && selectedSectorName && filters.status !== "all") {
    return `Filtered by ${selectedSectorName}, ${filters.status} challenge status, and the keyword “${filters.query}”.`;
  }

  if (filters.query && selectedSectorName) {
    return `Filtered by ${selectedSectorName} and the keyword “${filters.query}”.`;
  }

  if (filters.query) {
    return `Filtered by the keyword “${filters.query}” across public-safe challenge fields.`;
  }

  if (selectedSectorName) {
    return `Filtered to the governed ${selectedSectorName} sector.`;
  }

  if (filters.status !== "all") {
    return `Filtered to ${filters.status} challenges${selectedSectorName ? ` in ${selectedSectorName}` : ""}.`;
  }

  return "Browse public-safe challenge records by sector, keyword, and solution match signal, then open any record for full detail.";
}

function buildBadges(
  state: BrowseState,
  totalCount: number,
  selectedSectorName: string | null,
  status: ChallengeBrowseStatus,
): BrowseBadge[] {
  const badges: BrowseBadge[] = [{ label: "Public Access", tone: "green" }];

  if (state === "setup") {
    badges.push({ label: "Setup Required", tone: "gold" });
  } else if (state === "error") {
    badges.push({ label: "View Query Error", tone: "red" });
  } else {
    badges.push({
      label: `${formatNumber(totalCount)} Published`,
      tone: "blue",
    });
  }

  if (selectedSectorName) {
    badges.push({ label: selectedSectorName, tone: "gold" });
  }

  if (status !== "all") {
    badges.push({
      label: status === "open" ? "Open Challenges" : "Solved Challenges",
      tone: status === "open" ? "red" : "green",
    });
  }

  return badges;
}

function buildSectorOptions(
  sectors: PublicSectorRecord[],
  sectorActivity: PublicSectorActivityRecord[],
  selectedSectorSlug: string | null,
): BrowseSectorOption[] {
  const counts = new Map(
    sectorActivity.map((sector) => [sector.sectorSlug, sector.publishedChallengeCount]),
  );

  return sectors.map((sector) => ({
    active: sector.slug === selectedSectorSlug,
    label: sector.name,
    resultCount: counts.get(sector.slug) ?? 0,
    slug: sector.slug,
  }));
}

function buildQuickFilters(
  sectorOptions: BrowseSectorOption[],
  sectorActivity: PublicSectorActivityRecord[],
  selectedSectorSlug: string | null,
): BrowseQuickFilter[] {
  const topActiveSlugs = sectorActivity
    .filter((sector) => sector.publishedChallengeCount > 0)
    .slice(0, 6)
    .map((sector) => sector.sectorSlug);
  const orderedSlugs = selectedSectorSlug
    ? [selectedSectorSlug, ...topActiveSlugs.filter((slug) => slug !== selectedSectorSlug)]
    : topActiveSlugs;
  const quickFilters = orderedSlugs
    .map((slug) => sectorOptions.find((sector) => sector.slug === slug))
    .filter((sector): sector is BrowseSectorOption => Boolean(sector))
    .slice(0, 6)
    .map((sector, index) => ({
      active: sector.active,
      label: sector.label,
      priority: index < 2,
      resultCount: sector.resultCount,
      slug: sector.slug,
    }));

  return [
    {
      active: selectedSectorSlug === null,
      label: "All",
      priority: false,
      resultCount: sectorActivity.reduce(
        (total, sector) => total + sector.publishedChallengeCount,
        0,
      ),
      slug: null,
    },
    ...quickFilters,
  ];
}

function buildStatusOptions(status: ChallengeBrowseStatus): BrowseStatusOption[] {
  return [
    { active: status === "all", label: "All Challenges", value: "all" },
    { active: status === "open", label: "Open Only", value: "open" },
    { active: status === "solved", label: "Solved Only", value: "solved" },
  ];
}

function getStatusFilterLabel(status: ChallengeBrowseStatus) {
  if (status === "open") {
    return "Open Only";
  }

  if (status === "solved") {
    return "Solved Only";
  }

  return "All Challenges";
}

export function buildChallengesBrowseHref(filters: PublicChallengesBrowseFilters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.sectorSlug) {
    params.set("sector", filters.sectorSlug);
  }

  if (filters.sort !== "latest") {
    params.set("sort", filters.sort);
  }

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const queryString = params.toString();

  return queryString ? `/challenges?${queryString}` : "/challenges";
}

export function normalizePublicChallengesBrowseFilters(
  searchParams: SearchParamsRecord,
): PublicChallengesBrowseFilters {
  return {
    page: resolvePage(getSingleValue(searchParams.page)),
    query: normalizeSearchQuery(getSingleValue(searchParams.q)),
    sectorSlug: normalizeSectorSlug(getSingleValue(searchParams.sector)),
    sort: resolveSort(getSingleValue(searchParams.sort)),
    status: resolveStatus(getSingleValue(searchParams.status)),
  };
}

export function buildPublicChallengesBrowseViewModel({
  filters,
  generatedAt,
  snapshot,
  source,
}: BuildPublicChallengesBrowseViewModelInput): PublicChallengesBrowseViewModel {
  const referenceDate = new Date(generatedAt);
  const sectors = snapshot.sectors.length > 0 ? snapshot.sectors : createFallbackSectors();
  const pagination = buildPagination(filters, snapshot.totalCount);
  const selectedSector =
    sectors.find((sector) => sector.slug === filters.sectorSlug) ?? null;
  const state = resolveState(source, snapshot.totalCount);
  const sectorOptions = buildSectorOptions(sectors, snapshot.sectorActivity, selectedSector?.slug ?? null);

  return {
    badges: buildBadges(state, snapshot.totalCount, selectedSector?.name ?? null, filters.status),
    cards: snapshot.challenges.map((challenge) => toChallengeCard(challenge, referenceDate)),
    emptyMessage:
      filters.query || selectedSector
        ? "No published challenges match the current filters yet."
        : "No published challenges are available yet. Verified-member submissions will appear here after review and publication.",
    filters: {
      ...filters,
      page: pagination.currentPage,
      sectorSlug: selectedSector?.slug ?? null,
    },
    pagination,
    quickFilters: buildQuickFilters(
      sectorOptions,
      snapshot.sectorActivity,
      selectedSector?.slug ?? null,
    ),
    resultSummary: buildResultSummary(filters, snapshot.totalCount, pagination),
    sectorOptions,
    sortOptions: [
      { active: filters.sort === "latest", label: "Newest First", value: "latest" },
      { active: filters.sort === "matches", label: "Most Matched", value: "matches" },
      { active: filters.sort === "oldest", label: "Oldest First", value: "oldest" },
    ],
    statusOptions: buildStatusOptions(filters.status),
    state,
    stats: [
      {
        label: "Published Results",
        value: formatNumber(snapshot.totalCount),
      },
      {
        label: "Governed Sectors",
        value: formatNumber(sectors.length),
      },
      {
        label: "Challenge Status",
        value: getStatusFilterLabel(filters.status),
      },
    ],
    supportingText: buildSupportingText(state, filters, selectedSector?.name ?? null),
  };
}

export async function getPublicChallengesBrowseViewModel(
  searchParamsInput: Promise<SearchParamsRecord> | SearchParamsRecord,
) {
  const filters = normalizePublicChallengesBrowseFilters(await searchParamsInput);
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      return buildDemoChallengesBrowseViewModel(filters);
    }

    return buildPublicChallengesBrowseViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot: createEmptySnapshot(),
      source: "setup",
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const searchPattern = buildSearchPattern(filters.query);
    let countQuery = supabase
      .from(publicReadModelCatalog.publicChallenges)
      .select("id", { count: "exact", head: true });

    if (filters.sectorSlug) {
      countQuery = countQuery.eq("sector_slug", filters.sectorSlug);
    }

    if (filters.status === "open") {
      countQuery = countQuery.eq("linked_solution_count", 0);
    } else if (filters.status === "solved") {
      countQuery = countQuery.gt("linked_solution_count", 0);
    }

    if (searchPattern) {
      countQuery = countQuery.or(searchPattern);
    }

    const [sectorsResult, sectorActivityResult, countResult] = await Promise.all([
      supabase
        .from(publicReadModelCatalog.publicSectors)
        .select("*")
        .order("display_order", { ascending: true }),
      supabase
        .from(publicReadModelCatalog.publicSectorActivity)
        .select("*")
        .order("published_challenge_count", { ascending: false })
        .order("sector_name", { ascending: true }),
      countQuery,
    ]);

    const baseResults = [sectorsResult, sectorActivityResult, countResult];
    const baseError = baseResults.find((result) => result.error);

    if (baseError?.error) {
      console.error("Failed to load challenge browse metadata", baseError.error);

      if (demoEnabled) {
        return buildDemoChallengesBrowseViewModel(filters);
      }

      return buildPublicChallengesBrowseViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createEmptySnapshot(),
        source: "error",
      });
    }

    const totalCount = countResult.count ?? 0;

    if (demoEnabled && totalCount === 0) {
      return buildDemoChallengesBrowseViewModel(filters);
    }

    const safePage = Math.min(filters.page, Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
    let rowsQuery = supabase
      .from(publicReadModelCatalog.publicChallenges)
      .select("*");

    if (filters.sectorSlug) {
      rowsQuery = rowsQuery.eq("sector_slug", filters.sectorSlug);
    }

    if (filters.status === "open") {
      rowsQuery = rowsQuery.eq("linked_solution_count", 0);
    } else if (filters.status === "solved") {
      rowsQuery = rowsQuery.gt("linked_solution_count", 0);
    }

    if (searchPattern) {
      rowsQuery = rowsQuery.or(searchPattern);
    }

    if (filters.sort === "oldest") {
      rowsQuery = rowsQuery.order("published_at", { ascending: true });
    } else if (filters.sort === "matches") {
      rowsQuery = rowsQuery
        .order("linked_solution_count", { ascending: false })
        .order("published_at", { ascending: false });
    } else {
      rowsQuery = rowsQuery.order("published_at", { ascending: false });
    }

    const from = (safePage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const rowsResult = await rowsQuery.range(from, to);

    if (rowsResult.error) {
      console.error("Failed to load public challenges rows", rowsResult.error);

      if (demoEnabled) {
        return buildDemoChallengesBrowseViewModel(filters);
      }

      return buildPublicChallengesBrowseViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createEmptySnapshot(),
        source: "error",
      });
    }

    return buildPublicChallengesBrowseViewModel({
      filters: { ...filters, page: safePage },
      generatedAt: new Date().toISOString(),
      snapshot: {
        challenges: ((rowsResult.data ?? []) as Parameters<typeof mapPublicChallengeRow>[0][])
          .map(mapPublicChallengeRow),
        sectorActivity:
          ((sectorActivityResult.data ?? []) as Parameters<typeof mapPublicSectorActivityRow>[0][])
            .map(mapPublicSectorActivityRow),
        sectors: ((sectorsResult.data ?? []) as Parameters<typeof mapPublicSectorRow>[0][])
          .map(mapPublicSectorRow),
        totalCount,
      },
      source: "live",
    });
  } catch (error) {
    console.error("Unexpected public challenges browse failure", error);

    if (demoEnabled) {
      return buildDemoChallengesBrowseViewModel(filters);
    }

    return buildPublicChallengesBrowseViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot: createEmptySnapshot(),
      source: "error",
    });
  }
}
