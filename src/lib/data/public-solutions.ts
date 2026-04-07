import { readSupabasePublicEnvironment } from "@/config/env";
import { isDemoDataEnabled } from "@/config/demo";
import type {
  PublicSectorActivityRecord,
  PublicSectorRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import { publicReadModelCatalog } from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";
import { createPublicDemoSnapshot } from "@/lib/demo/public-demo-content";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import {
  mapPublicSectorActivityRow,
  mapPublicSectorRow,
  mapPublicSolutionRow,
} from "./public-record-mappers";

type BrowseSource = "error" | "live" | "setup";
type BrowseState = "empty" | "error" | "live" | "setup";
type BrowseTone = "blue" | "gold" | "green" | "red" | "teal";
export type SolutionsBrowseSort = "latest" | "links" | "votes";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type BrowseSnapshot = {
  providerCount: number;
  sectorActivity: PublicSectorActivityRecord[];
  sectors: PublicSectorRecord[];
  solutions: PublicSolutionRecord[];
  totalCount: number;
};

export const PAGE_SIZE = 6;

export type PublicSolutionsBrowseFilters = {
  accessModel: PublicSolutionRecord["accessModel"] | null;
  page: number;
  query: string;
  sectorSlug: string | null;
  sort: SolutionsBrowseSort;
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

type BrowseAccessOption = {
  active: boolean;
  label: string;
  value: PublicSolutionRecord["accessModel"] | null;
};

type BrowseSortOption = {
  active: boolean;
  label: string;
  value: SolutionsBrowseSort;
};

type BrowseStat = {
  label: string;
  value: string;
};

type BrowseSolutionCard = {
  engagementLabel: string;
  href: string;
  publicationLabel: string;
  publicationTone: BrowseTone;
  regionLabel: string;
  sectorLabel: string;
  sectorTone: BrowseTone;
  summary: string;
  title: string;
  votes: number;
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

export type PublicSolutionsBrowseViewModel = {
  accessOptions: BrowseAccessOption[];
  badges: BrowseBadge[];
  cards: BrowseSolutionCard[];
  emptyMessage: string;
  filters: PublicSolutionsBrowseFilters;
  pagination: BrowsePagination;
  quickFilters: BrowseQuickFilter[];
  resultSummary: string;
  sectorOptions: BrowseSectorOption[];
  sortOptions: BrowseSortOption[];
  state: BrowseState;
  stats: BrowseStat[];
  supportingText: string;
};

type BuildPublicSolutionsBrowseViewModelInput = {
  filters: PublicSolutionsBrowseFilters;
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

function resolveAccessModel(value: string): PublicSolutionRecord["accessModel"] | null {
  if (value === "free" || value === "paid" || value === "contact") {
    return value;
  }

  return null;
}

function resolveSort(value: string): SolutionsBrowseSort {
  if (value === "links" || value === "votes") {
    return value;
  }

  return "latest";
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
    providerCount: 0,
    sectorActivity: [],
    sectors: [],
    solutions: [],
    totalCount: 0,
  };
}

function matchesSolutionQuery(solution: PublicSolutionRecord, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();
  const searchableValues = [
    solution.title,
    solution.summary,
    solution.offeringDescription,
    solution.companyName,
    solution.sectorName,
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

function sortSolutions(solutions: PublicSolutionRecord[], sort: SolutionsBrowseSort) {
  return [...solutions].sort((left, right) => {
    if (sort === "votes") {
      if (right.voteCount !== left.voteCount) {
        return right.voteCount - left.voteCount;
      }
    } else if (sort === "links") {
      if (right.linkedChallengeCount !== left.linkedChallengeCount) {
        return right.linkedChallengeCount - left.linkedChallengeCount;
      }
    }

    return right.publishedAt.localeCompare(left.publishedAt);
  });
}

function buildDemoSolutionsBrowseViewModel(filters: PublicSolutionsBrowseFilters) {
  const demo = createPublicDemoSnapshot();
  const filteredSolutions = sortSolutions(
    demo.solutions.filter((solution) => {
      const matchesSector = filters.sectorSlug
        ? solution.sectorSlug === filters.sectorSlug
        : true;
      const matchesAccess = filters.accessModel
        ? solution.accessModel === filters.accessModel
        : true;

      return matchesSector && matchesAccess && matchesSolutionQuery(solution, filters.query);
    }),
    filters.sort,
  );
  const totalCount = filteredSolutions.length;
  const safePage = Math.min(filters.page, Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  return buildPublicSolutionsBrowseViewModel({
    filters: { ...filters, page: safePage },
    generatedAt: new Date().toISOString(),
    snapshot: {
      providerCount: demo.companies.length,
      sectorActivity: demo.sectorActivity,
      sectors: demo.sectors,
      solutions: filteredSolutions.slice(from, to),
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
    `offering_description.ilike.${pattern}`,
    `company_name.ilike.${pattern}`,
    `sector_name.ilike.${pattern}`,
    `coverage_label.ilike.${pattern}`,
  ].join(",");
}

function resolvePublicationTone(accessModel: PublicSolutionRecord["accessModel"]): BrowseTone {
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

function toAccessFilterLabel(accessModel: PublicSolutionRecord["accessModel"]) {
  if (accessModel === "free") {
    return "Free";
  }

  if (accessModel === "paid") {
    return "Paid";
  }

  return "Contact";
}

function toSolutionCard(
  solution: PublicSolutionRecord,
  referenceDate: Date,
): BrowseSolutionCard {
  return {
    engagementLabel: `${solution.linkedChallengeCount} match${
      solution.linkedChallengeCount === 1 ? "" : "es"
    } · ${formatRelativeDate(solution.publishedAt, referenceDate)}`,
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
  filters: PublicSolutionsBrowseFilters,
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
      href: buildSolutionsBrowseHref({ ...filters, page }),
      label: String(page),
    });
  }

  return {
    currentPage,
    hasNextPage: currentPage < pageCount,
    hasPreviousPage: currentPage > 1,
    nextHref:
      currentPage < pageCount ? buildSolutionsBrowseHref({ ...filters, page: currentPage + 1 }) : null,
    pageCount,
    pages,
    previousHref:
      currentPage > 1 ? buildSolutionsBrowseHref({ ...filters, page: currentPage - 1 }) : null,
  };
}

function buildResultSummary(
  filters: PublicSolutionsBrowseFilters,
  totalCount: number,
  pagination: BrowsePagination,
) {
  if (totalCount === 0) {
    return "Showing 0 published solutions";
  }

  const start = (pagination.currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(totalCount, start + PAGE_SIZE - 1);

  return `Showing ${start}-${end} of ${formatNumber(totalCount)} published solutions`;
}

function buildSupportingText(
  state: BrowseState,
  filters: PublicSolutionsBrowseFilters,
  selectedSectorName: string | null,
) {
  if (state === "setup") {
    return "Connect NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load published solution browse results from Supabase.";
  }

  if (state === "error") {
    return "The solutions browse surface is wired to live public views, but the query path could not load. Verify the T04 and T06 migrations in Supabase.";
  }

  if (state === "empty") {
    if (filters.query || selectedSectorName || filters.accessModel) {
      return "No published solutions match the current search, sector, and access filters. Reset the filters to broaden discovery.";
    }

    return "The solutions browse view is live, but there are no published solution records available yet.";
  }

  if (filters.query && selectedSectorName && filters.accessModel) {
    return `Filtered by ${selectedSectorName}, the ${toAccessFilterLabel(filters.accessModel)} access model, and the keyword “${filters.query}”.`;
  }

  if (filters.query) {
    return `Filtered by the keyword “${filters.query}” across published solution, provider, and sector fields.`;
  }

  if (selectedSectorName) {
    return `Filtered to the governed ${selectedSectorName} sector.`;
  }

  if (filters.accessModel) {
    return `Filtered to ${toAccessFilterLabel(filters.accessModel).toLowerCase()} solution access models.`;
  }

  return "Browse published reusable solutions by sector, access model, provider context, and challenge match signal, then open any record for full detail.";
}

function buildBadges(
  state: BrowseState,
  totalCount: number,
  selectedSectorName: string | null,
  accessModel: PublicSolutionRecord["accessModel"] | null,
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

  if (accessModel) {
    badges.push({
      label: toPublicationLabel(accessModel),
      tone: resolvePublicationTone(accessModel),
    });
  }

  return badges;
}

function buildSortLabel(sort: SolutionsBrowseSort) {
  if (sort === "votes") {
    return "Most Voted";
  }

  if (sort === "links") {
    return "Most Linked";
  }

  return "Newest First";
}

function buildSectorOptions(
  sectors: PublicSectorRecord[],
  sectorActivity: PublicSectorActivityRecord[],
  selectedSectorSlug: string | null,
): BrowseSectorOption[] {
  const counts = new Map(
    sectorActivity.map((sector) => [sector.sectorSlug, sector.publishedSolutionCount]),
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
    .filter((sector) => sector.publishedSolutionCount > 0)
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
        (total, sector) => total + sector.publishedSolutionCount,
        0,
      ),
      slug: null,
    },
    ...quickFilters,
  ];
}

export function buildSolutionsBrowseHref(filters: PublicSolutionsBrowseFilters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.sectorSlug) {
    params.set("sector", filters.sectorSlug);
  }

  if (filters.accessModel) {
    params.set("access", filters.accessModel);
  }

  if (filters.sort !== "latest") {
    params.set("sort", filters.sort);
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const queryString = params.toString();

  return queryString ? `/solutions?${queryString}` : "/solutions";
}

export function normalizePublicSolutionsBrowseFilters(
  searchParams: SearchParamsRecord,
): PublicSolutionsBrowseFilters {
  return {
    accessModel: resolveAccessModel(getSingleValue(searchParams.access)),
    page: resolvePage(getSingleValue(searchParams.page)),
    query: normalizeSearchQuery(getSingleValue(searchParams.q)),
    sectorSlug: normalizeSectorSlug(getSingleValue(searchParams.sector)),
    sort: resolveSort(getSingleValue(searchParams.sort)),
  };
}

export function buildPublicSolutionsBrowseViewModel({
  filters,
  generatedAt,
  snapshot,
  source,
}: BuildPublicSolutionsBrowseViewModelInput): PublicSolutionsBrowseViewModel {
  const referenceDate = new Date(generatedAt);
  const sectors = snapshot.sectors.length > 0 ? snapshot.sectors : createFallbackSectors();
  const pagination = buildPagination(filters, snapshot.totalCount);
  const selectedSector =
    sectors.find((sector) => sector.slug === filters.sectorSlug) ?? null;
  const state = resolveState(source, snapshot.totalCount);
  const sectorOptions = buildSectorOptions(
    sectors,
    snapshot.sectorActivity,
    selectedSector?.slug ?? null,
  );

  return {
    accessOptions: [
      { active: filters.accessModel === null, label: "All access models", value: null },
      { active: filters.accessModel === "free", label: "Free Solution", value: "free" },
      { active: filters.accessModel === "paid", label: "Paid Solution", value: "paid" },
      { active: filters.accessModel === "contact", label: "Contact Provider", value: "contact" },
    ],
    badges: buildBadges(
      state,
      snapshot.totalCount,
      selectedSector?.name ?? null,
      filters.accessModel,
    ),
    cards: snapshot.solutions.map((solution) => toSolutionCard(solution, referenceDate)),
    emptyMessage:
      filters.query || selectedSector || filters.accessModel
        ? "No published solutions match the current filters yet."
        : "No published solutions are available yet. Verified-member solution records will appear here immediately after publication.",
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
      { active: filters.sort === "votes", label: "Most Voted", value: "votes" },
      { active: filters.sort === "links", label: "Most Linked", value: "links" },
    ],
    state,
    stats: [
      {
        label: "Published Results",
        value: formatNumber(snapshot.totalCount),
      },
      {
        label: "Public Providers",
        value: formatNumber(snapshot.providerCount),
      },
      {
        label: "Sort Order",
        value: buildSortLabel(filters.sort),
      },
    ],
    supportingText: buildSupportingText(state, filters, selectedSector?.name ?? null),
  };
}

export async function getPublicSolutionsBrowseViewModel(
  searchParamsInput: Promise<SearchParamsRecord> | SearchParamsRecord,
) {
  const filters = normalizePublicSolutionsBrowseFilters(await searchParamsInput);
  const env = readSupabasePublicEnvironment();
  const demoEnabled = isDemoDataEnabled();

  if (!env) {
    if (demoEnabled) {
      return buildDemoSolutionsBrowseViewModel(filters);
    }

    return buildPublicSolutionsBrowseViewModel({
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
      .from(publicReadModelCatalog.publicSolutions)
      .select("id", { count: "exact", head: true });

    if (filters.sectorSlug) {
      countQuery = countQuery.eq("sector_slug", filters.sectorSlug);
    }

    if (filters.accessModel) {
      countQuery = countQuery.eq("access_model", filters.accessModel);
    }

    if (searchPattern) {
      countQuery = countQuery.or(searchPattern);
    }

    const [sectorsResult, sectorActivityResult, countResult, providerCountResult] =
      await Promise.all([
        supabase
          .from(publicReadModelCatalog.publicSectors)
          .select("*")
          .order("display_order", { ascending: true }),
        supabase
          .from(publicReadModelCatalog.publicSectorActivity)
          .select("*")
          .order("published_solution_count", { ascending: false })
          .order("sector_name", { ascending: true }),
        countQuery,
        supabase
          .from(publicReadModelCatalog.publicCompanies)
          .select("id", { count: "exact", head: true }),
      ]);

    const baseResults = [sectorsResult, sectorActivityResult, countResult, providerCountResult];
    const baseError = baseResults.find((result) => result.error);

    if (baseError?.error) {
      console.error("Failed to load solutions browse metadata", baseError.error);

      if (demoEnabled) {
        return buildDemoSolutionsBrowseViewModel(filters);
      }

      return buildPublicSolutionsBrowseViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createEmptySnapshot(),
        source: "error",
      });
    }

    const totalCount = countResult.count ?? 0;
    const providerCount = providerCountResult.count ?? 0;

    if (demoEnabled && totalCount === 0) {
      return buildDemoSolutionsBrowseViewModel(filters);
    }

    const safePage = Math.min(filters.page, Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
    let rowsQuery = supabase
      .from(publicReadModelCatalog.publicSolutions)
      .select("*");

    if (filters.sectorSlug) {
      rowsQuery = rowsQuery.eq("sector_slug", filters.sectorSlug);
    }

    if (filters.accessModel) {
      rowsQuery = rowsQuery.eq("access_model", filters.accessModel);
    }

    if (searchPattern) {
      rowsQuery = rowsQuery.or(searchPattern);
    }

    if (filters.sort === "votes") {
      rowsQuery = rowsQuery
        .order("vote_count", { ascending: false })
        .order("published_at", { ascending: false });
    } else if (filters.sort === "links") {
      rowsQuery = rowsQuery
        .order("linked_challenge_count", { ascending: false })
        .order("published_at", { ascending: false });
    } else {
      rowsQuery = rowsQuery.order("published_at", { ascending: false });
    }

    const from = (safePage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const rowsResult = await rowsQuery.range(from, to);

    if (rowsResult.error) {
      console.error("Failed to load public solutions rows", rowsResult.error);

      if (demoEnabled) {
        return buildDemoSolutionsBrowseViewModel(filters);
      }

      return buildPublicSolutionsBrowseViewModel({
        filters,
        generatedAt: new Date().toISOString(),
        snapshot: createEmptySnapshot(),
        source: "error",
      });
    }

    return buildPublicSolutionsBrowseViewModel({
      filters: { ...filters, page: safePage },
      generatedAt: new Date().toISOString(),
      snapshot: {
        providerCount,
        sectorActivity:
          ((sectorActivityResult.data ?? []) as Parameters<typeof mapPublicSectorActivityRow>[0][])
            .map(mapPublicSectorActivityRow),
        sectors: ((sectorsResult.data ?? []) as Parameters<typeof mapPublicSectorRow>[0][])
          .map(mapPublicSectorRow),
        solutions: ((rowsResult.data ?? []) as Parameters<typeof mapPublicSolutionRow>[0][])
          .map(mapPublicSolutionRow),
        totalCount,
      },
      source: "live",
    });
  } catch (error) {
    console.error("Unexpected public solutions browse failure", error);

    if (demoEnabled) {
      return buildDemoSolutionsBrowseViewModel(filters);
    }

    return buildPublicSolutionsBrowseViewModel({
      filters,
      generatedAt: new Date().toISOString(),
      snapshot: createEmptySnapshot(),
      source: "error",
    });
  }
}
