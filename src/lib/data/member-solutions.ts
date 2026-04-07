import type { SolutionAccessModel, SolutionStatus } from "@/domain/contracts";
import type { ISODateTimeString } from "@/domain/models";
import type { PublicSectorRecord } from "@/domain/public-records";
import { publicReadModelCatalog } from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";
import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import { selectVerifiedContributionMembership } from "@/lib/contributions/memberships";
import {
  calculateSolutionAuthoringCompletion,
  createEmptySolutionAuthoringInput,
  normalizeSolutionAuthoringInput,
  type SolutionAuthoringInput,
} from "@/lib/solutions/authoring";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { mapPublicSectorRow } from "./public-record-mappers";

type SolutionRecord = {
  access_model: SolutionAccessModel;
  company_id: string;
  coverage_label: string | null;
  created_at: ISODateTimeString;
  id: string;
  offering_description: string;
  owner_membership_id: string;
  published_at: ISODateTimeString;
  sector_id: string;
  slug: string;
  status: SolutionStatus;
  summary: string;
  title: string;
  updated_at: ISODateTimeString;
};

type ChallengeSolutionLinkRecord = {
  challenge_id: string;
  created_at: ISODateTimeString;
  id: string;
  solution_id: string;
};

type ChallengeLinkOptionRow = {
  company_name: string;
  id: string;
  published_at: string | null;
  sector_id: string;
  sector_name: string;
  slug: string;
  title: string;
};

export type SolutionEditorSectorOption = Pick<
  PublicSectorRecord,
  "description" | "id" | "name" | "slug"
>;

export type SolutionLinkChallengeOption = {
  companyName: string;
  id: string;
  publishedAt: string | null;
  sectorId: string;
  sectorName: string;
  slug: string;
  title: string;
};

export type MemberSolutionSummary = {
  accessModel: SolutionAccessModel;
  companyName: string | null;
  completion: ReturnType<typeof calculateSolutionAuthoringCompletion>;
  coverageLabel: string | null;
  id: string;
  input: SolutionAuthoringInput;
  linkedChallengeCount: number;
  linkedChallenges: SolutionLinkChallengeOption[];
  publishedAt: string;
  slug: string;
  status: SolutionStatus;
  updatedAt: string;
};

export type SolutionWorkspacePageData = {
  canCreateSolution: boolean;
  candidateChallenges: SolutionLinkChallengeOption[];
  companyName: string | null;
  preselectedAccessModel: SolutionAccessModel | null;
  preselectedChallenge: SolutionLinkChallengeOption | null;
  selectedSolution: MemberSolutionSummary | null;
  solutionMissing: boolean;
  solutions: MemberSolutionSummary[];
  sectors: SolutionEditorSectorOption[];
  viewerName: string;
  workspaceError: string | null;
};

function createFallbackSectors(): SolutionEditorSectorOption[] {
  return sectorSeeds.map((sector) => ({
    description: sector.description,
    id: sector.slug,
    name: sector.name,
    slug: sector.slug,
  }));
}

function createWorkspaceError({
  hasEnvironment,
  membership,
}: {
  hasEnvironment: boolean;
  membership: ReturnType<typeof selectVerifiedContributionMembership>;
}) {
  if (!hasEnvironment) {
    return "Connect Supabase to load your owned solutions and publish new records.";
  }

  if (!membership) {
    return "A verified company membership is required before you can publish a solution.";
  }

  if (!membership.company) {
    return "Your verified membership does not have an active company profile attached yet.";
  }

  return null;
}

function mapChallengeOptionRow(row: ChallengeLinkOptionRow): SolutionLinkChallengeOption {
  return {
    companyName: row.company_name,
    id: row.id,
    publishedAt: row.published_at,
    sectorId: row.sector_id,
    sectorName: row.sector_name,
    slug: row.slug,
    title: row.title,
  };
}

function mergeChallengeOptions(
  primary: SolutionLinkChallengeOption[],
  secondary: SolutionLinkChallengeOption[],
) {
  const merged = new Map<string, SolutionLinkChallengeOption>();

  for (const option of [...primary, ...secondary]) {
    if (!merged.has(option.id)) {
      merged.set(option.id, option);
    }
  }

  return [...merged.values()].sort((left, right) =>
    (right.publishedAt ?? "").localeCompare(left.publishedAt ?? ""),
  );
}

function mapSolutionRecord({
  companiesById,
  linkedChallengesBySolutionId,
  record,
}: {
  companiesById: Map<string, string>;
  linkedChallengesBySolutionId: Map<string, SolutionLinkChallengeOption[]>;
  record: SolutionRecord;
}): MemberSolutionSummary {
  const linkedChallenges = linkedChallengesBySolutionId.get(record.id) ?? [];
  const input = normalizeSolutionAuthoringInput({
    accessModel: record.access_model,
    coverageLabel: record.coverage_label,
    linkedChallengeIds: linkedChallenges.map((challenge) => challenge.id),
    offeringDescription: record.offering_description,
    sectorId: record.sector_id,
    solutionId: record.id,
    summary: record.summary,
    title: record.title,
  });

  return {
    accessModel: record.access_model,
    companyName: companiesById.get(record.company_id) ?? null,
    completion: calculateSolutionAuthoringCompletion(input),
    coverageLabel: record.coverage_label,
    id: record.id,
    input,
    linkedChallengeCount: linkedChallenges.length,
    linkedChallenges,
    publishedAt: record.published_at,
    slug: record.slug,
    status: record.status,
    updatedAt: record.updated_at,
  };
}

export function formatSolutionDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function getSolutionStatusLabel(status: SolutionStatus) {
  if (status === "under_review") {
    return "Under review";
  }

  if (status === "hidden") {
    return "Hidden";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Published";
}

export function getSolutionStatusTone(status: SolutionStatus) {
  if (status === "under_review") {
    return "gold" as const;
  }

  if (status === "hidden") {
    return "red" as const;
  }

  if (status === "archived") {
    return "blue" as const;
  }

  return "green" as const;
}

export function getSolutionAccessModelLabel(accessModel: SolutionAccessModel) {
  if (accessModel === "free") {
    return "Free Solution";
  }

  if (accessModel === "paid") {
    return "Paid Solution";
  }

  return "Contact Provider";
}

export function getSolutionAccessModelTone(accessModel: SolutionAccessModel) {
  if (accessModel === "free") {
    return "green" as const;
  }

  if (accessModel === "paid") {
    return "gold" as const;
  }

  return "blue" as const;
}

export function resolveSolutionAccessModel(
  value: string | null | undefined,
): SolutionAccessModel | null {
  if (value === "free" || value === "paid" || value === "contact") {
    return value;
  }

  return null;
}

export function getSolutionAuthoringStatusMessage(status: string | null | undefined) {
  if (status === "published") {
    return "Solution published. It is now a reusable public record and can appear across discovery surfaces.";
  }

  if (status === "updated") {
    return "Solution updated. Your published record now reflects the latest metadata and challenge links.";
  }

  return null;
}

export function getInitialSolutionAuthoringInput(
  solution: MemberSolutionSummary | null,
  options: {
    preselectedAccessModel?: SolutionAccessModel | null;
    preselectedChallenge?: SolutionLinkChallengeOption | null;
  } = {},
) {
  if (solution) {
    return solution.input;
  }

  const input = createEmptySolutionAuthoringInput();

  if (options.preselectedAccessModel) {
    input.accessModel = options.preselectedAccessModel;
  }

  if (options.preselectedChallenge) {
    input.linkedChallengeIds = [options.preselectedChallenge.id];
    input.sectorId = options.preselectedChallenge.sectorId;
  }

  return input;
}

export async function getSolutionWorkspacePageData({
  challengeId,
  accessModel,
  solutionId,
}: {
  accessModel?: SolutionAccessModel;
  challengeId?: string;
  solutionId?: string;
} = {}): Promise<SolutionWorkspacePageData> {
  const viewer = await getCurrentViewer();
  const env = readSupabasePublicEnvironment();
  const createMembership = selectVerifiedContributionMembership(viewer.memberships);
  const defaultWorkspaceError = createWorkspaceError({
    hasEnvironment: Boolean(env),
    membership: createMembership,
  });

  if (!env) {
    return {
      canCreateSolution: false,
      candidateChallenges: [],
      companyName: createMembership?.company?.name ?? viewer.primaryCompany?.name ?? null,
      preselectedAccessModel: accessModel ?? null,
      preselectedChallenge: null,
      selectedSolution: null,
      solutionMissing: Boolean(solutionId),
      solutions: [],
      sectors: createFallbackSectors(),
      viewerName: viewer.displayName,
      workspaceError: defaultWorkspaceError,
    };
  }

  const supabase = await getSupabaseServerClient();
  const [sectorsResult, solutionsResult, recentChallengesResult] = await Promise.all([
    supabase
      .from(publicReadModelCatalog.publicSectors)
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("solutions")
      .select(
        "id, slug, owner_membership_id, company_id, sector_id, title, summary, offering_description, coverage_label, access_model, status, published_at, created_at, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from(publicReadModelCatalog.publicChallenges)
      .select("id, slug, title, company_name, sector_id, sector_name, published_at")
      .order("published_at", { ascending: false })
      .limit(12),
  ]);

  if (solutionsResult.error) {
    return {
      canCreateSolution: false,
      candidateChallenges: [],
      companyName: createMembership?.company?.name ?? viewer.primaryCompany?.name ?? null,
      preselectedAccessModel: accessModel ?? null,
      preselectedChallenge: null,
      selectedSolution: null,
      solutionMissing: Boolean(solutionId),
      solutions: [],
      sectors: createFallbackSectors(),
      viewerName: viewer.displayName,
      workspaceError: "We couldn't load your solution workspace just now. Please try again.",
    };
  }

  const sectors =
    sectorsResult.error || !sectorsResult.data
      ? createFallbackSectors()
      : (sectorsResult.data as Parameters<typeof mapPublicSectorRow>[0][])
          .map(mapPublicSectorRow)
          .map((sector) => ({
            description: sector.description,
            id: sector.id,
            name: sector.name,
            slug: sector.slug,
          }));

  const solutionRows = (solutionsResult.data ?? []) as SolutionRecord[];
  const solutionIds = solutionRows.map((record) => record.id);
  const companiesById = new Map(
    viewer.memberships
      .filter((membership) => membership.company)
      .map((membership) => [membership.companyId, membership.company!.name]),
  );

  const linksResult =
    solutionIds.length > 0
      ? await supabase
          .from("challenge_solution_links")
          .select("id, challenge_id, solution_id, created_at")
          .in("solution_id", solutionIds)
      : { data: [], error: null };

  const linkRows = (linksResult.data ?? []) as ChallengeSolutionLinkRecord[];
  const linkedChallengeIds = [...new Set(linkRows.map((record) => record.challenge_id))];

  const recentChallengeOptions =
    recentChallengesResult.error || !recentChallengesResult.data
      ? []
      : (recentChallengesResult.data as ChallengeLinkOptionRow[]).map(mapChallengeOptionRow);

  const missingLinkedChallengeIds = linkedChallengeIds.filter(
    (challengeId) => !recentChallengeOptions.some((option) => option.id === challengeId),
  );

  const additionalLinkedChallengesResult =
    missingLinkedChallengeIds.length > 0
      ? await supabase
          .from(publicReadModelCatalog.publicChallenges)
          .select("id, slug, title, company_name, sector_id, sector_name, published_at")
          .in("id", missingLinkedChallengeIds)
      : { data: [], error: null };

  const additionalLinkedChallenges =
    additionalLinkedChallengesResult.error || !additionalLinkedChallengesResult.data
      ? []
      : (additionalLinkedChallengesResult.data as ChallengeLinkOptionRow[]).map(
          mapChallengeOptionRow,
        );

  const challengeOptions = mergeChallengeOptions(
    recentChallengeOptions,
    additionalLinkedChallenges,
  );
  const challengeOptionsById = new Map(
    challengeOptions.map((option) => [option.id, option]),
  );
  const linkedChallengesBySolutionId = new Map<string, SolutionLinkChallengeOption[]>();

  for (const link of linkRows) {
    const option = challengeOptionsById.get(link.challenge_id);

    if (!option) {
      continue;
    }

    const current = linkedChallengesBySolutionId.get(link.solution_id) ?? [];

    linkedChallengesBySolutionId.set(link.solution_id, [...current, option]);
  }

  const solutions = solutionRows.map((record) =>
    mapSolutionRecord({
      companiesById,
      linkedChallengesBySolutionId,
      record,
    }),
  );
  const selectedSolution = solutionId
    ? solutions.find((solution) => solution.id === solutionId) ?? null
    : null;
  const preselectedChallenge =
    challengeId && !selectedSolution
      ? challengeOptions.find((challenge) => challenge.id === challengeId) ?? null
      : null;

  return {
    canCreateSolution: Boolean(createMembership?.company),
    candidateChallenges: challengeOptions,
    companyName:
      selectedSolution?.companyName ??
      createMembership?.company?.name ??
      viewer.primaryCompany?.name ??
      null,
    preselectedAccessModel: selectedSolution ? null : accessModel ?? null,
    preselectedChallenge,
    selectedSolution,
    solutionMissing: Boolean(solutionId) && selectedSolution === null,
    solutions,
    sectors,
    viewerName: viewer.displayName,
    workspaceError: selectedSolution ? null : defaultWorkspaceError,
  };
}
