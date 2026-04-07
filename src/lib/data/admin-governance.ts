import { readSupabasePublicEnvironment } from "@/config/env";
import type {
  MembershipRole,
  MembershipVerificationStatus,
  SolutionStatus,
} from "@/domain/contracts";
import {
  adminGovernanceEventNames,
  createEmptySectorGovernanceInput,
  getChallengeStatusLabel,
  getChallengeStatusTone,
  getCompanyGovernanceStatusMessage,
  getLinkOversightStatusMessage,
  getMembershipVerificationLabel,
  getMembershipVerificationTone,
  getModerationStatusMessage,
  getSectorGovernanceStatusMessage,
  getSolutionStatusLabel,
  getSolutionStatusTone,
  normalizeCompanyGovernanceInput,
  normalizeSectorGovernanceInput,
  type CompanyGovernanceInput,
  type SectorGovernanceInput,
} from "@/lib/admin/governance";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParamsRecord = Record<string, string | string[] | undefined>;
type GovernanceTone = "blue" | "gold" | "green" | "red";
type GovernanceState = "empty" | "error" | "live";
type GovernanceBadge = { label: string; tone: GovernanceTone };

type ModerationChallengeItem = {
  anonymityMode: "anonymous" | "named";
  companyName: string;
  id: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  sectorName: string;
  status: "archived" | "pending_review" | "published" | "rejected";
  title: string;
  updatedAt: string;
};

type ModerationSolutionItem = {
  companyName: string;
  id: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
  sectorName: string;
  status: SolutionStatus;
  title: string;
  updatedAt: string;
};

type GovernanceEventItem = {
  actionLabel: string;
  actorLabel: string;
  occurredAt: string;
  targetLabel: string;
};

type SectorSummaryItem = {
  challengeCount: number;
  description: string;
  displayOrder: number;
  iconKey: string | null;
  id: string;
  isVisible: boolean;
  name: string;
  slug: string;
  solutionCount: number;
};

type CompanySummaryItem = {
  city: string | null;
  countryCode: string | null;
  description: string | null;
  headquartersLabel: string | null;
  id: string;
  isPublic: boolean;
  membershipCount: number;
  name: string;
  pendingMembershipCount: number;
  publishedChallengeCount: number;
  publishedSolutionCount: number;
  slug: string;
  verifiedMembershipCount: number;
  websiteUrl: string | null;
};

type CompanyMemberItem = {
  email: string | null;
  id: string;
  isPrimary: boolean;
  role: MembershipRole;
  userLabel: string;
  verificationStatus: MembershipVerificationStatus;
};

type LinkCandidateItem = {
  id: string;
  label: string;
};

type LinkSummaryItem = {
  challengeId: string;
  challengeLabel: string;
  createdAt: string;
  id: string;
  linkedByLabel: string;
  solutionId: string;
  solutionLabel: string;
};

type ModerationViewSnapshot = {
  challenges: ModerationChallengeItem[];
  events: GovernanceEventItem[];
  solutions: ModerationSolutionItem[];
  state: GovernanceState;
  statusMessage: string | null;
};

type SectorsViewSnapshot = {
  sectors: SectorSummaryItem[];
  state: GovernanceState;
  statusMessage: string | null;
};

type CompaniesViewSnapshot = {
  companies: CompanySummaryItem[];
  membershipsByCompanyId: Map<string, CompanyMemberItem[]>;
  state: GovernanceState;
  statusMessage: string | null;
};

type LinksViewSnapshot = {
  candidates: {
    challenges: LinkCandidateItem[];
    solutions: LinkCandidateItem[];
  };
  links: LinkSummaryItem[];
  state: GovernanceState;
  statusMessage: string | null;
};

type ModerationSelectionCard = {
  href: string;
  id: string;
  meta: string;
  selected: boolean;
  statusLabel: string;
  statusTone: GovernanceTone;
  subtitle: string;
  title: string;
};

type ModerationSelectedRecord = {
  companyLabel: string;
  id: string;
  reviewNotes: string;
  reviewedLabel: string;
  sectorLabel: string;
  status: string;
  statusLabel: string;
  statusTone: GovernanceTone;
  title: string;
};

type GovernanceFeedItem = {
  meta: string;
  text: string;
};

export type AdminModerationViewModel = {
  badges: GovernanceBadge[];
  challengeQueue: ModerationSelectionCard[];
  recentEvents: GovernanceFeedItem[];
  selectedChallenge: ModerationSelectedRecord | null;
  selectedSolution: ModerationSelectedRecord | null;
  solutionQueue: ModerationSelectionCard[];
  state: GovernanceState;
  statusMessage: string | null;
  supportingText: string;
};

export type AdminSectorRecordView = {
  challengeCountLabel: string;
  description: string;
  displayOrder: number;
  href: string;
  iconKey: string;
  id: string;
  input: SectorGovernanceInput;
  name: string;
  selected: boolean;
  solutionCountLabel: string;
  visibilityLabel: string;
};

export type AdminSectorsViewModel = {
  badges: GovernanceBadge[];
  sectors: AdminSectorRecordView[];
  selectedSector: AdminSectorRecordView | null;
  state: GovernanceState;
  statusMessage: string | null;
  supportingText: string;
};

export type AdminCompanyMemberView = {
  email: string | null;
  id: string;
  isPrimary: boolean;
  roleLabel: string;
  userLabel: string;
  verificationLabel: string;
  verificationTone: GovernanceTone;
  verificationValue: MembershipVerificationStatus;
};

export type AdminCompanyRecordView = {
  href: string;
  id: string;
  input: CompanyGovernanceInput;
  membershipSummary: string;
  members: AdminCompanyMemberView[];
  name: string;
  selected: boolean;
  trustSummary: string;
  visibilityLabel: string;
};

export type AdminCompaniesViewModel = {
  badges: GovernanceBadge[];
  companies: AdminCompanyRecordView[];
  selectedCompany: AdminCompanyRecordView | null;
  state: GovernanceState;
  statusMessage: string | null;
  supportingText: string;
};

export type AdminLinkRecordView = {
  challengeId: string;
  challengeLabel: string;
  createdLabel: string;
  href: string;
  id: string;
  linkedByLabel: string;
  selected: boolean;
  solutionId: string;
  solutionLabel: string;
};

export type AdminLinksViewModel = {
  badges: GovernanceBadge[];
  candidates: {
    challenges: LinkCandidateItem[];
    solutions: LinkCandidateItem[];
  };
  createHint: string;
  links: AdminLinkRecordView[];
  selectedLink: AdminLinkRecordView | null;
  state: GovernanceState;
  statusMessage: string | null;
  supportingText: string;
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatRelativeDate(input: string | null) {
  if (!input) {
    return "Not reviewed yet";
  }

  return new Date(input).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function resolveUserLabel(record: {
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}) {
  const fullName = [record.first_name, record.last_name].filter(Boolean).join(" ").trim();

  return record.display_name || fullName || record.email || "Member";
}

function toSelectionCard(
  item: ModerationChallengeItem | ModerationSolutionItem,
  href: string,
  selected: boolean,
  statusLabel: string,
  statusTone: GovernanceTone,
  subtitle: string,
): ModerationSelectionCard {
  return {
    href,
    id: item.id,
    meta: `${item.companyName} · ${item.sectorName} · ${formatRelativeDate(item.updatedAt)}`,
    selected,
    statusLabel,
    statusTone,
    subtitle,
    title: item.title,
  };
}

function toSelectedModerationRecord(
  item: ModerationChallengeItem | ModerationSolutionItem,
  statusLabel: string,
  statusTone: GovernanceTone,
): ModerationSelectedRecord {
  return {
    companyLabel: item.companyName,
    id: item.id,
    reviewNotes: item.reviewNotes ?? "",
    reviewedLabel: formatRelativeDate(item.reviewedAt),
    sectorLabel: item.sectorName,
    status: item.status,
    statusLabel,
    statusTone,
    title: item.title,
  };
}

export function buildAdminModerationViewModel({
  selectedChallengeId,
  selectedSolutionId,
  snapshot,
}: {
  selectedChallengeId?: string;
  selectedSolutionId?: string;
  snapshot: ModerationViewSnapshot;
}): AdminModerationViewModel {
  const selectedChallenge =
    snapshot.challenges.find((item) => item.id === selectedChallengeId) ??
    snapshot.challenges[0] ??
    null;
  const selectedSolution =
    snapshot.solutions.find((item) => item.id === selectedSolutionId) ??
    snapshot.solutions[0] ??
    null;
  const pendingChallenges = snapshot.challenges.filter(
    (item) => item.status === "pending_review",
  ).length;
  const flaggedSolutions = snapshot.solutions.filter(
    (item) => item.status === "under_review" || item.status === "hidden",
  ).length;

  return {
    badges: [
      { label: "Protected Admin", tone: "red" },
      { label: `${pendingChallenges} Pending Challenges`, tone: "gold" },
      { label: `${flaggedSolutions} Flagged Solutions`, tone: "blue" },
    ],
    challengeQueue: snapshot.challenges.map((item) =>
      toSelectionCard(
        item,
        `/admin/moderation?challenge=${item.id}${selectedSolution ? `&solution=${selectedSolution.id}` : ""}`,
        item.id === selectedChallenge?.id,
        getChallengeStatusLabel(item.status),
        getChallengeStatusTone(item.status),
        item.anonymityMode === "anonymous" ? "Anonymous submission" : "Named submission",
      ),
    ),
    recentEvents: snapshot.events.map((event) => ({
      meta: `${formatRelativeDate(event.occurredAt)} · ${event.actorLabel}`,
      text: `${event.actionLabel} — ${event.targetLabel}`,
    })),
    selectedChallenge: selectedChallenge
      ? toSelectedModerationRecord(
          selectedChallenge,
          getChallengeStatusLabel(selectedChallenge.status),
          getChallengeStatusTone(selectedChallenge.status),
        )
      : null,
    selectedSolution: selectedSolution
      ? toSelectedModerationRecord(
          selectedSolution,
          getSolutionStatusLabel(selectedSolution.status),
          getSolutionStatusTone(selectedSolution.status),
        )
      : null,
    solutionQueue: snapshot.solutions.map((item) =>
      toSelectionCard(
        item,
        `/admin/moderation?solution=${item.id}${selectedChallenge ? `&challenge=${selectedChallenge.id}` : ""}`,
        item.id === selectedSolution?.id,
        getSolutionStatusLabel(item.status),
        getSolutionStatusTone(item.status),
        "Solution override controls",
      ),
    ),
    state: snapshot.state,
    statusMessage: snapshot.statusMessage,
    supportingText:
      snapshot.state === "error"
        ? "The governance queues could not be loaded from Supabase. Verify that the admin session and T04-T06 schema are available."
        : "Review pending challenges, apply solution overrides, and keep an audit-friendly record of governance decisions without touching the public analytics surface.",
  };
}

export function buildAdminSectorsViewModel({
  selectedSectorId,
  snapshot,
}: {
  selectedSectorId?: string;
  snapshot: SectorsViewSnapshot;
}): AdminSectorsViewModel {
  const selectedSector =
    snapshot.sectors.find((sector) => sector.id === selectedSectorId) ??
    snapshot.sectors[0] ??
    null;
  const visibleCount = snapshot.sectors.filter((sector) => sector.isVisible).length;
  const hiddenCount = snapshot.sectors.length - visibleCount;
  const sectors = snapshot.sectors.map((sector) => {
    const input = normalizeSectorGovernanceInput({
      description: sector.description,
      displayOrder: String(sector.displayOrder),
      iconKey: sector.iconKey ?? "",
      id: sector.id,
      isVisible: sector.isVisible,
      name: sector.name,
      slug: sector.slug,
    });

    return {
      challengeCountLabel: formatCount(sector.challengeCount, "challenge"),
      description: sector.description,
      displayOrder: sector.displayOrder,
      href: `/admin/sectors?sector=${sector.id}`,
      iconKey: sector.iconKey ?? "general",
      id: sector.id,
      input,
      name: sector.name,
      selected: sector.id === selectedSector?.id,
      solutionCountLabel: formatCount(sector.solutionCount, "solution"),
      visibilityLabel: sector.isVisible
        ? "Visible in public discovery"
        : "Hidden from public discovery",
    };
  });

  return {
    badges: [
      { label: `${visibleCount} Visible`, tone: "green" },
      { label: `${hiddenCount} Hidden`, tone: "blue" },
      { label: `${snapshot.sectors.length} Governed Sectors`, tone: "gold" },
    ],
    sectors,
    selectedSector:
      sectors.find((sector) => sector.id === selectedSector?.id) ??
      (selectedSectorId === "new"
        ? {
            challengeCountLabel: "0 challenges",
            description: "",
            displayOrder: 0,
            href: "/admin/sectors?sector=new",
            iconKey: "general",
            id: "",
            input: createEmptySectorGovernanceInput(),
            name: "Create New Sector",
            selected: true,
            solutionCountLabel: "0 solutions",
            visibilityLabel: "Visible in public discovery",
          }
        : null),
    state: snapshot.state,
    statusMessage: snapshot.statusMessage,
    supportingText:
      snapshot.state === "error"
        ? "Governed taxonomy data could not be loaded right now."
        : "Manage the governed sector catalog, visibility, ordering, and metadata that drive discovery and analytics surfaces.",
  };
}

export function buildAdminCompaniesViewModel({
  selectedCompanyId,
  snapshot,
}: {
  selectedCompanyId?: string;
  snapshot: CompaniesViewSnapshot;
}): AdminCompaniesViewModel {
  const selectedCompany =
    snapshot.companies.find((company) => company.id === selectedCompanyId) ??
    snapshot.companies[0] ??
    null;
  const publicCount = snapshot.companies.filter((company) => company.isPublic).length;
  const privateCount = snapshot.companies.length - publicCount;
  const pendingCount = snapshot.companies.reduce(
    (sum, company) => sum + company.pendingMembershipCount,
    0,
  );
  const companies = snapshot.companies.map((company) => {
    const input = normalizeCompanyGovernanceInput({
      city: company.city ?? "",
      countryCode: company.countryCode ?? "",
      description: company.description ?? "",
      headquartersLabel: company.headquartersLabel ?? "",
      id: company.id,
      isPublic: company.isPublic,
      name: company.name,
      slug: company.slug,
      websiteUrl: company.websiteUrl ?? "",
    });
    const members = (snapshot.membershipsByCompanyId.get(company.id) ?? []).map((member) => ({
      email: member.email,
      id: member.id,
      isPrimary: member.isPrimary,
      roleLabel: member.role === "company_admin" ? "Company Admin" : "Member",
      userLabel: member.userLabel,
      verificationLabel: getMembershipVerificationLabel(member.verificationStatus),
      verificationTone: getMembershipVerificationTone(member.verificationStatus),
      verificationValue: member.verificationStatus,
    }));

    return {
      href: `/admin/companies?company=${company.id}`,
      id: company.id,
      input,
      membershipSummary: `${company.membershipCount} memberships · ${company.verifiedMembershipCount} verified`,
      members,
      name: company.name,
      selected: company.id === selectedCompany?.id,
      trustSummary: `${company.publishedChallengeCount} published challenges · ${company.publishedSolutionCount} published solutions`,
      visibilityLabel: company.isPublic ? "Public profile visible" : "Private profile only",
    };
  });

  return {
    badges: [
      { label: `${publicCount} Public Companies`, tone: "green" },
      { label: `${privateCount} Private Companies`, tone: "blue" },
      { label: `${pendingCount} Pending Memberships`, tone: "gold" },
    ],
    companies,
    selectedCompany:
      companies.find((company) => company.id === selectedCompany?.id) ?? null,
    state: snapshot.state,
    statusMessage: snapshot.statusMessage,
    supportingText:
      snapshot.state === "error"
        ? "Company governance data could not be loaded right now."
        : "Oversee company trust, public profile visibility, and member verification state from one protected workspace.",
  };
}

export function buildAdminLinksViewModel({
  selectedLinkId,
  snapshot,
}: {
  selectedLinkId?: string;
  snapshot: LinksViewSnapshot;
}): AdminLinksViewModel {
  const selectedLink =
    snapshot.links.find((link) => link.id === selectedLinkId) ??
    snapshot.links[0] ??
    null;
  const links = snapshot.links.map((link) => ({
    challengeId: link.challengeId,
    challengeLabel: link.challengeLabel,
    createdLabel: formatRelativeDate(link.createdAt),
    href: `/admin/links?link=${link.id}`,
    id: link.id,
    linkedByLabel: link.linkedByLabel,
    selected: link.id === selectedLink?.id,
    solutionId: link.solutionId,
    solutionLabel: link.solutionLabel,
  }));

  return {
    badges: [
      { label: `${snapshot.links.length} Active Links`, tone: "green" },
      {
        label: `${snapshot.candidates.challenges.length} Challenge Candidates`,
        tone: "gold",
      },
      {
        label: `${snapshot.candidates.solutions.length} Solution Candidates`,
        tone: "blue",
      },
    ],
    candidates: snapshot.candidates,
    createHint:
      "Link a published challenge to a published solution when the record relationship is credible and should appear across discovery surfaces.",
    links,
    selectedLink: links.find((link) => link.id === selectedLink?.id) ?? null,
    state: snapshot.state,
    statusMessage: snapshot.statusMessage,
    supportingText:
      snapshot.state === "error"
        ? "Challenge-solution link oversight could not be loaded right now."
        : "Create or remove challenge-solution associations without weakening the public-safe record model.",
  };
}

function resolveModerationSearchParams(searchParams: SearchParamsRecord) {
  return {
    challengeId: getSingleValue(searchParams.challenge),
    solutionId: getSingleValue(searchParams.solution),
    status: getSingleValue(searchParams.status),
  };
}

function resolveSectorSearchParams(searchParams: SearchParamsRecord) {
  return {
    sectorId: getSingleValue(searchParams.sector),
    status: getSingleValue(searchParams.status),
  };
}

function resolveCompanySearchParams(searchParams: SearchParamsRecord) {
  return {
    companyId: getSingleValue(searchParams.company),
    status: getSingleValue(searchParams.status),
  };
}

function resolveLinksSearchParams(searchParams: SearchParamsRecord) {
  return {
    linkId: getSingleValue(searchParams.link),
    status: getSingleValue(searchParams.status),
  };
}

type GovernanceEventRow = {
  actor_user_id: string | null;
  event_name: (typeof adminGovernanceEventNames)[number];
  occurred_at: string;
  payload: {
    action_label?: string;
    actor_label?: string;
    target_label?: string;
  } | null;
};

export async function getAdminModerationViewModel(
  searchParams: Promise<SearchParamsRecord>,
) {
  const env = readSupabasePublicEnvironment();
  const resolved = resolveModerationSearchParams(await searchParams);

  if (!env) {
    return buildAdminModerationViewModel({
      selectedChallengeId: resolved.challengeId,
      selectedSolutionId: resolved.solutionId,
      snapshot: {
        challenges: [],
        events: [],
        solutions: [],
        state: "error",
        statusMessage: getModerationStatusMessage(resolved.status),
      },
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [challengesResult, solutionsResult, eventsResult] = await Promise.all([
      supabase
        .from("challenges")
        .select("id, title, status, anonymity_mode, review_notes, reviewed_at, updated_at, company_profiles(name), sectors(name)")
        .in("status", ["pending_review", "published", "rejected", "archived"])
        .order("status", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("solutions")
        .select("id, title, status, review_notes, reviewed_at, updated_at, company_profiles(name), sectors(name)")
        .in("status", ["published", "under_review", "hidden", "archived"])
        .order("updated_at", { ascending: false })
        .limit(12),
      supabase
        .from("analytics_events")
        .select("actor_user_id, event_name, occurred_at, payload")
        .in("event_name", [...adminGovernanceEventNames])
        .order("occurred_at", { ascending: false })
        .limit(8),
    ]);

    if (challengesResult.error || solutionsResult.error || eventsResult.error) {
      throw challengesResult.error ?? solutionsResult.error ?? eventsResult.error;
    }

    const challenges = ((challengesResult.data ?? []) as Array<{
      anonymity_mode: "anonymous" | "named";
      company_profiles: { name: string } | { name: string }[] | null;
      id: string;
      review_notes: string | null;
      reviewed_at: string | null;
      sectors: { name: string } | { name: string }[] | null;
      status: ModerationChallengeItem["status"];
      title: string;
      updated_at: string;
    }>).map((row) => ({
      anonymityMode: row.anonymity_mode,
      companyName: Array.isArray(row.company_profiles)
        ? (row.company_profiles[0]?.name ?? "Unknown Company")
        : (row.company_profiles?.name ?? "Unknown Company"),
      id: row.id,
      reviewNotes: row.review_notes,
      reviewedAt: row.reviewed_at,
      sectorName: Array.isArray(row.sectors)
        ? (row.sectors[0]?.name ?? "Unassigned Sector")
        : (row.sectors?.name ?? "Unassigned Sector"),
      status: row.status,
      title: row.title,
      updatedAt: row.updated_at,
    }));

    const solutions = ((solutionsResult.data ?? []) as Array<{
      company_profiles: { name: string } | { name: string }[] | null;
      id: string;
      review_notes: string | null;
      reviewed_at: string | null;
      sectors: { name: string } | { name: string }[] | null;
      status: SolutionStatus;
      title: string;
      updated_at: string;
    }>).map((row) => ({
      companyName: Array.isArray(row.company_profiles)
        ? (row.company_profiles[0]?.name ?? "Unknown Company")
        : (row.company_profiles?.name ?? "Unknown Company"),
      id: row.id,
      reviewNotes: row.review_notes,
      reviewedAt: row.reviewed_at,
      sectorName: Array.isArray(row.sectors)
        ? (row.sectors[0]?.name ?? "Unassigned Sector")
        : (row.sectors?.name ?? "Unassigned Sector"),
      status: row.status,
      title: row.title,
      updatedAt: row.updated_at,
    }));

    const events = ((eventsResult.data ?? []) as GovernanceEventRow[]).map((row) => ({
      actionLabel: row.payload?.action_label ?? row.event_name,
      actorLabel: row.payload?.actor_label ?? "Admin",
      occurredAt: row.occurred_at,
      targetLabel: row.payload?.target_label ?? "Governed record",
    }));

    return buildAdminModerationViewModel({
      selectedChallengeId: resolved.challengeId,
      selectedSolutionId: resolved.solutionId,
      snapshot: {
        challenges,
        events,
        solutions,
        state:
          challenges.length > 0 || solutions.length > 0 || events.length > 0
            ? "live"
            : "empty",
        statusMessage: getModerationStatusMessage(resolved.status),
      },
    });
  } catch {
    return buildAdminModerationViewModel({
      selectedChallengeId: resolved.challengeId,
      selectedSolutionId: resolved.solutionId,
      snapshot: {
        challenges: [],
        events: [],
        solutions: [],
        state: "error",
        statusMessage: getModerationStatusMessage(resolved.status),
      },
    });
  }
}

export async function getAdminSectorsViewModel(
  searchParams: Promise<SearchParamsRecord>,
) {
  const env = readSupabasePublicEnvironment();
  const resolved = resolveSectorSearchParams(await searchParams);

  if (!env) {
    return buildAdminSectorsViewModel({
      selectedSectorId: resolved.sectorId,
      snapshot: {
        sectors: [],
        state: "error",
        statusMessage: getSectorGovernanceStatusMessage(resolved.status),
      },
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [sectorsResult, challengesResult, solutionsResult] = await Promise.all([
      supabase
        .from("sectors")
        .select("id, slug, name, description, display_order, is_visible, icon_key")
        .order("display_order", { ascending: true }),
      supabase.from("challenges").select("sector_id"),
      supabase.from("solutions").select("sector_id"),
    ]);

    if (sectorsResult.error || challengesResult.error || solutionsResult.error) {
      throw sectorsResult.error ?? challengesResult.error ?? solutionsResult.error;
    }

    const challengeCountBySector = new Map<string, number>();
    const solutionCountBySector = new Map<string, number>();

    for (const row of (challengesResult.data ?? []) as Array<{ sector_id: string }>) {
      challengeCountBySector.set(row.sector_id, (challengeCountBySector.get(row.sector_id) ?? 0) + 1);
    }

    for (const row of (solutionsResult.data ?? []) as Array<{ sector_id: string }>) {
      solutionCountBySector.set(row.sector_id, (solutionCountBySector.get(row.sector_id) ?? 0) + 1);
    }

    const sectors = ((sectorsResult.data ?? []) as Array<{
      description: string;
      display_order: number;
      icon_key: string | null;
      id: string;
      is_visible: boolean;
      name: string;
      slug: string;
    }>).map((row) => ({
      challengeCount: challengeCountBySector.get(row.id) ?? 0,
      description: row.description,
      displayOrder: row.display_order,
      iconKey: row.icon_key,
      id: row.id,
      isVisible: row.is_visible,
      name: row.name,
      slug: row.slug,
      solutionCount: solutionCountBySector.get(row.id) ?? 0,
    }));

    return buildAdminSectorsViewModel({
      selectedSectorId: resolved.sectorId,
      snapshot: {
        sectors,
        state: sectors.length > 0 ? "live" : "empty",
        statusMessage: getSectorGovernanceStatusMessage(resolved.status),
      },
    });
  } catch {
    return buildAdminSectorsViewModel({
      selectedSectorId: resolved.sectorId,
      snapshot: {
        sectors: [],
        state: "error",
        statusMessage: getSectorGovernanceStatusMessage(resolved.status),
      },
    });
  }
}

export async function getAdminCompaniesViewModel(
  searchParams: Promise<SearchParamsRecord>,
) {
  const env = readSupabasePublicEnvironment();
  const resolved = resolveCompanySearchParams(await searchParams);

  if (!env) {
    return buildAdminCompaniesViewModel({
      selectedCompanyId: resolved.companyId,
      snapshot: {
        companies: [],
        membershipsByCompanyId: new Map(),
        state: "error",
        statusMessage: getCompanyGovernanceStatusMessage(resolved.status),
      },
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [companiesResult, membershipsResult, profilesResult, challengesResult, solutionsResult] =
      await Promise.all([
        supabase
          .from("company_profiles")
          .select("id, slug, name, description, headquarters_label, is_public, website_url, country_code, city")
          .order("name", { ascending: true }),
        supabase
          .from("memberships")
          .select("id, user_id, company_id, role, verification_status, is_primary")
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("id, email, display_name, first_name, last_name"),
        supabase
          .from("challenges")
          .select("company_id")
          .eq("status", "published"),
        supabase
          .from("solutions")
          .select("company_id")
          .eq("status", "published"),
      ]);

    if (
      companiesResult.error ||
      membershipsResult.error ||
      profilesResult.error ||
      challengesResult.error ||
      solutionsResult.error
    ) {
      throw (
        companiesResult.error ??
        membershipsResult.error ??
        profilesResult.error ??
        challengesResult.error ??
        solutionsResult.error
      );
    }

    const challengeCountByCompany = new Map<string, number>();
    const solutionCountByCompany = new Map<string, number>();

    for (const row of (challengesResult.data ?? []) as Array<{ company_id: string }>) {
      challengeCountByCompany.set(
        row.company_id,
        (challengeCountByCompany.get(row.company_id) ?? 0) + 1,
      );
    }

    for (const row of (solutionsResult.data ?? []) as Array<{ company_id: string }>) {
      solutionCountByCompany.set(
        row.company_id,
        (solutionCountByCompany.get(row.company_id) ?? 0) + 1,
      );
    }

    const profilesById = new Map(
      ((profilesResult.data ?? []) as Array<{
        display_name: string | null;
        email: string | null;
        first_name: string | null;
        id: string;
        last_name: string | null;
      }>).map((profile) => [profile.id, profile]),
    );
    const membershipMap = new Map<string, CompanyMemberItem[]>();

    for (const membership of (membershipsResult.data ?? []) as Array<{
      company_id: string;
      id: string;
      is_primary: boolean;
      role: MembershipRole;
      user_id: string;
      verification_status: MembershipVerificationStatus;
    }>) {
      const members = membershipMap.get(membership.company_id) ?? [];
      const profile = profilesById.get(membership.user_id);

      members.push({
        email: profile?.email ?? null,
        id: membership.id,
        isPrimary: membership.is_primary,
        role: membership.role,
        userLabel: profile
          ? resolveUserLabel(profile)
          : "Member",
        verificationStatus: membership.verification_status,
      });
      membershipMap.set(membership.company_id, members);
    }

    const companies = ((companiesResult.data ?? []) as Array<{
      city: string | null;
      country_code: string | null;
      description: string | null;
      headquarters_label: string | null;
      id: string;
      is_public: boolean;
      name: string;
      slug: string;
      website_url: string | null;
    }>).map((company) => {
      const members = membershipMap.get(company.id) ?? [];

      return {
        city: company.city,
        countryCode: company.country_code,
        description: company.description,
        headquartersLabel: company.headquarters_label,
        id: company.id,
        isPublic: company.is_public,
        membershipCount: members.length,
        name: company.name,
        pendingMembershipCount: members.filter(
          (member) => member.verificationStatus === "pending",
        ).length,
        publishedChallengeCount: challengeCountByCompany.get(company.id) ?? 0,
        publishedSolutionCount: solutionCountByCompany.get(company.id) ?? 0,
        slug: company.slug,
        verifiedMembershipCount: members.filter(
          (member) => member.verificationStatus === "verified",
        ).length,
        websiteUrl: company.website_url,
      };
    });

    return buildAdminCompaniesViewModel({
      selectedCompanyId: resolved.companyId,
      snapshot: {
        companies,
        membershipsByCompanyId: membershipMap,
        state: companies.length > 0 ? "live" : "empty",
        statusMessage: getCompanyGovernanceStatusMessage(resolved.status),
      },
    });
  } catch {
    return buildAdminCompaniesViewModel({
      selectedCompanyId: resolved.companyId,
      snapshot: {
        companies: [],
        membershipsByCompanyId: new Map(),
        state: "error",
        statusMessage: getCompanyGovernanceStatusMessage(resolved.status),
      },
    });
  }
}

export async function getAdminLinksViewModel(
  searchParams: Promise<SearchParamsRecord>,
) {
  const env = readSupabasePublicEnvironment();
  const resolved = resolveLinksSearchParams(await searchParams);

  if (!env) {
    return buildAdminLinksViewModel({
      selectedLinkId: resolved.linkId,
      snapshot: {
        candidates: { challenges: [], solutions: [] },
        links: [],
        state: "error",
        statusMessage: getLinkOversightStatusMessage(resolved.status),
      },
    });
  }

  try {
    const supabase = await getSupabaseServerClient();
    const [linksResult, challengesResult, solutionsResult, profilesResult] = await Promise.all([
      supabase
        .from("challenge_solution_links")
        .select("id, challenge_id, solution_id, linked_by_user_id, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("challenges")
        .select("id, title")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("solutions")
        .select("id, title")
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase.from("profiles").select("id, email, display_name, first_name, last_name"),
    ]);

    if (linksResult.error || challengesResult.error || solutionsResult.error || profilesResult.error) {
      throw (
        linksResult.error ??
        challengesResult.error ??
        solutionsResult.error ??
        profilesResult.error
      );
    }

    const challengeMap = new Map(
      ((challengesResult.data ?? []) as Array<{ id: string; title: string }>).map((challenge) => [
        challenge.id,
        challenge.title,
      ]),
    );
    const solutionMap = new Map(
      ((solutionsResult.data ?? []) as Array<{ id: string; title: string }>).map((solution) => [
        solution.id,
        solution.title,
      ]),
    );
    const profileMap = new Map(
      ((profilesResult.data ?? []) as Array<{
        display_name: string | null;
        email: string | null;
        first_name: string | null;
        id: string;
        last_name: string | null;
      }>).map((profile) => [profile.id, profile]),
    );

    const links = ((linksResult.data ?? []) as Array<{
      challenge_id: string;
      created_at: string;
      id: string;
      linked_by_user_id: string | null;
      solution_id: string;
    }>)
      .filter(
        (link) =>
          challengeMap.has(link.challenge_id) && solutionMap.has(link.solution_id),
      )
      .map((link) => ({
        challengeId: link.challenge_id,
        challengeLabel: challengeMap.get(link.challenge_id) ?? "Unknown Challenge",
        createdAt: link.created_at,
        id: link.id,
        linkedByLabel: link.linked_by_user_id
          ? resolveUserLabel(profileMap.get(link.linked_by_user_id) ?? {
              display_name: null,
              email: null,
              first_name: null,
              last_name: null,
            })
          : "Admin",
        solutionId: link.solution_id,
        solutionLabel: solutionMap.get(link.solution_id) ?? "Unknown Solution",
      }));

    return buildAdminLinksViewModel({
      selectedLinkId: resolved.linkId,
      snapshot: {
        candidates: {
          challenges: [...challengeMap.entries()].map(([id, label]) => ({ id, label })),
          solutions: [...solutionMap.entries()].map(([id, label]) => ({ id, label })),
        },
        links,
        state: links.length > 0 || challengeMap.size > 0 || solutionMap.size > 0 ? "live" : "empty",
        statusMessage: getLinkOversightStatusMessage(resolved.status),
      },
    });
  } catch {
    return buildAdminLinksViewModel({
      selectedLinkId: resolved.linkId,
      snapshot: {
        candidates: { challenges: [], solutions: [] },
        links: [],
        state: "error",
        statusMessage: getLinkOversightStatusMessage(resolved.status),
      },
    });
  }
}
