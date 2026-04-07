import type {
  ChallengeAnonymityMode,
  ChallengeStatus,
  RelayParticipantRole,
  RelayThreadStatus,
  SolutionAccessModel,
} from "@/domain/contracts";
import { publicReadModelCatalog } from "@/domain/public-records";
import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import { selectVerifiedContributionMembership } from "@/lib/contributions/memberships";
import {
  formatRelayTimestamp,
  getRelayCounterpartLabel,
  getRelayThreadStatusLabel,
  getRelayThreadStatusTone,
  getRelayWorkspaceStatusMessage,
  truncateRelayPreview,
} from "@/lib/relay/messaging";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { mapPublicChallengeRow, mapPublicSolutionRow, mapPublicSectorRow } from "./public-record-mappers";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type ChallengeWorkspaceRecord = {
  anonymity_mode: ChallengeAnonymityMode;
  geography_label: string | null;
  id: string;
  owner_membership_id: string;
  published_at: string | null;
  sector_id: string;
  slug: string;
  status: ChallengeStatus;
  summary: string;
  title: string;
  updated_at: string;
};

type RelayThreadRecord = {
  challenge_id: string;
  challenge_owner_membership_id: string;
  created_at: string;
  id: string;
  last_message_at: string | null;
  responder_membership_id: string;
  solution_id: string | null;
  status: RelayThreadStatus;
  updated_at: string;
};

type RelayMessageRecord = {
  body: string;
  created_at: string;
  id: string;
  sender_role: RelayParticipantRole;
  thread_id: string;
};

type OwnedSolutionRecord = {
  access_model: SolutionAccessModel;
  id: string;
  published_at: string;
  slug: string;
  summary: string;
  title: string;
};

type WorkspaceSource = "error" | "live" | "setup";

type RelayThreadPerspective = "challenge_owner" | "responder";

export type RelaySolutionOption = {
  helperText: string;
  id: string;
  title: string;
};

export type RelayThreadListItem = {
  active: boolean;
  challengeTitle: string;
  counterpartLabel: string;
  href: string;
  id: string;
  lastMessageAtLabel: string;
  lastMessagePreview: string;
  linkedSolutionLabel: string | null;
  perspectiveLabel: string;
  statusLabel: string;
  statusTone: ReturnType<typeof getRelayThreadStatusTone>;
};

export type RelayThreadMessageItem = {
  body: string;
  createdAtLabel: string;
  id: string;
  isOwn: boolean;
  senderLabel: string;
};

export type RelayThreadDetail = {
  canReply: boolean;
  challengeHref: string;
  challengeSummary: string;
  challengeTitle: string;
  counterpartLabel: string;
  id: string;
  linkedSolutionHref: string | null;
  linkedSolutionLabel: string | null;
  messages: RelayThreadMessageItem[];
  perspective: RelayThreadPerspective;
  statusLabel: string;
  statusTone: ReturnType<typeof getRelayThreadStatusTone>;
};

export type RelayResponseTarget = {
  challengeId: string;
  challengeSlug: string;
  geographyLabel: string | null;
  sectorLabel: string;
  summary: string;
  title: string;
};

export type OwnedChallengeListItem = {
  anonymityLabel: string;
  href: string;
  id: string;
  relayThreadCount: number;
  sectorLabel: string;
  statusLabel: string;
  statusTone: "blue" | "gold" | "green" | "red";
  title: string;
  updatedAtLabel: string;
};

export type ChallengeWorkspacePageData = {
  availableSolutions: RelaySolutionOption[];
  canInitiateRelay: boolean;
  ownedChallenges: OwnedChallengeListItem[];
  relayThreads: RelayThreadListItem[];
  responseTarget: RelayResponseTarget | null;
  responseTargetError: string | null;
  selectedThread: RelayThreadDetail | null;
  statusMessage: string | null;
  threadMissing: boolean;
  viewerCompanyName: string | null;
  viewerName: string;
  workspaceError: string | null;
};

export type ChallengeWorkspaceSearchParams = {
  challengeSlug: string | null;
  status: string | null;
  threadId: string | null;
};

function getSingleValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearchValue(value: string | string[] | undefined) {
  return getSingleValue(value).trim();
}

export function normalizeChallengeWorkspaceSearchParams(
  searchParams: SearchParamsRecord,
): ChallengeWorkspaceSearchParams {
  return {
    challengeSlug: normalizeSearchValue(searchParams.challenge) || null,
    status: normalizeSearchValue(searchParams.status) || null,
    threadId: normalizeSearchValue(searchParams.thread) || null,
  };
}

function createEmptyWorkspace({
  viewerCompanyName,
  viewerName,
  workspaceError,
}: {
  viewerCompanyName: string | null;
  viewerName: string;
  workspaceError: string | null;
}): ChallengeWorkspacePageData {
  return {
    availableSolutions: [],
    canInitiateRelay: false,
    ownedChallenges: [],
    relayThreads: [],
    responseTarget: null,
    responseTargetError: null,
    selectedThread: null,
    statusMessage: null,
    threadMissing: false,
    viewerCompanyName,
    viewerName,
    workspaceError,
  };
}

function formatChallengeWorkspaceDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function getChallengeStatusLabel(status: ChallengeStatus) {
  if (status === "pending_review") {
    return "Pending review";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "Published";
}

function getChallengeStatusTone(status: ChallengeStatus) {
  if (status === "pending_review") {
    return "gold" as const;
  }

  if (status === "rejected") {
    return "red" as const;
  }

  if (status === "archived") {
    return "blue" as const;
  }

  return "green" as const;
}

function buildMembershipOrFilter(column: string, membershipIds: string[]) {
  return `${column}.in.(${membershipIds.join(",")})`;
}

function resolvePerspective(
  record: RelayThreadRecord,
  membershipIds: string[],
): RelayThreadPerspective | null {
  if (membershipIds.includes(record.challenge_owner_membership_id)) {
    return "challenge_owner";
  }

  if (membershipIds.includes(record.responder_membership_id)) {
    return "responder";
  }

  return null;
}

function getThreadSenderLabel({
  perspective,
  senderRole,
  solutionCompanyName,
  viewerCompanyName,
}: {
  perspective: RelayThreadPerspective;
  senderRole: RelayParticipantRole;
  solutionCompanyName: string | null;
  viewerCompanyName: string | null;
}) {
  if (senderRole === "admin") {
    return "Platform admin";
  }

  if (perspective === "responder") {
    if (senderRole === "responder") {
      return viewerCompanyName ?? "Your company";
    }

    return "Anonymous challenge owner";
  }

  if (senderRole === "challenge_owner") {
    return "Anonymous challenge owner";
  }

  return solutionCompanyName ?? "Verified responder";
}

async function loadRelayThreads(
  membershipIds: string[],
  source: WorkspaceSource,
) {
  if (membershipIds.length === 0 || source !== "live") {
    return {
      error: null,
      records: [] as RelayThreadRecord[],
    };
  }

  const supabase = await getSupabaseServerClient();
  const result = await supabase
    .from("relay_threads")
    .select(
      "id, challenge_id, challenge_owner_membership_id, responder_membership_id, solution_id, status, last_message_at, created_at, updated_at",
    )
    .or(
      [
        buildMembershipOrFilter("challenge_owner_membership_id", membershipIds),
        buildMembershipOrFilter("responder_membership_id", membershipIds),
      ].join(","),
    )
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  return {
    error: result.error,
    records: (result.data ?? []) as RelayThreadRecord[],
  };
}

export async function getChallengeWorkspacePageData(
  params: ChallengeWorkspaceSearchParams,
): Promise<ChallengeWorkspacePageData> {
  const viewer = await getCurrentViewer();
  const verifiedMembership = selectVerifiedContributionMembership(viewer.memberships);
  const viewerCompanyName = verifiedMembership?.company?.name ?? viewer.primaryCompany?.name ?? null;
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return {
      ...createEmptyWorkspace({
        viewerCompanyName,
        viewerName: viewer.displayName,
        workspaceError:
          "Connect Supabase to load your challenge workspace, relay inbox, and protected relay threads.",
      }),
      statusMessage: getRelayWorkspaceStatusMessage(params.status),
    };
  }

  const membershipIds = viewer.memberships.map((membership) => membership.id);
  const supabase = await getSupabaseServerClient();

  const [ownedChallengesResult, relayThreadsResult, sectorsResult, responseTargetResult, availableSolutionsResult] =
    await Promise.all([
      membershipIds.length > 0
        ? supabase
            .from("challenges")
            .select(
              "id, slug, title, summary, status, anonymity_mode, sector_id, owner_membership_id, geography_label, published_at, updated_at",
            )
            .in("owner_membership_id", membershipIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      loadRelayThreads(membershipIds, "live"),
      supabase
        .from(publicReadModelCatalog.publicSectors)
        .select("*")
        .order("display_order", { ascending: true }),
      params.challengeSlug
        ? supabase
            .from(publicReadModelCatalog.publicChallenges)
            .select("*")
            .eq("slug", params.challengeSlug)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      verifiedMembership
        ? supabase
            .from("solutions")
            .select("id, slug, title, summary, access_model, published_at")
            .eq("owner_membership_id", verifiedMembership.id)
            .eq("status", "published")
            .order("published_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

  let workspaceError: string | null = null;

  if (
    ownedChallengesResult.error ||
    relayThreadsResult.error ||
    sectorsResult.error ||
    responseTargetResult.error ||
    availableSolutionsResult.error
  ) {
    console.error("Failed to load challenge workspace", {
      availableSolutionsError: availableSolutionsResult.error,
      ownedChallengesError: ownedChallengesResult.error,
      relayThreadsError: relayThreadsResult.error,
      responseTargetError: responseTargetResult.error,
      sectorsError: sectorsResult.error,
    });

    workspaceError =
      "The challenge workspace is wired up, but the protected relay query path could not load right now.";
  }

  const ownedChallenges = (ownedChallengesResult.data ?? []) as ChallengeWorkspaceRecord[];
  const relayThreadRecords = relayThreadsResult.records;
  const sectorMap = new Map(
    ((sectorsResult.data ?? []) as Parameters<typeof mapPublicSectorRow>[0][])
      .map(mapPublicSectorRow)
      .map((sector) => [sector.id, sector.name]),
  );
  const availableSolutions = ((availableSolutionsResult.data ?? []) as OwnedSolutionRecord[]).map(
    (solution) => ({
      helperText: `${solution.title} · ${formatChallengeWorkspaceDate(solution.published_at)}`,
      id: solution.id,
      title: solution.title,
    }),
  );

  const threadIds = relayThreadRecords.map((record) => record.id);
  const challengeIds = [...new Set(relayThreadRecords.map((record) => record.challenge_id))];
  const solutionIds = [
    ...new Set(
      relayThreadRecords
        .map((record) => record.solution_id)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  const [threadChallengesResult, threadSolutionsResult, threadMessagesResult] = await Promise.all([
    challengeIds.length > 0
      ? supabase
          .from(publicReadModelCatalog.publicChallenges)
          .select("*")
          .in("id", challengeIds)
      : Promise.resolve({ data: [], error: null }),
    solutionIds.length > 0
      ? supabase
          .from(publicReadModelCatalog.publicSolutions)
          .select("*")
          .in("id", solutionIds)
      : Promise.resolve({ data: [], error: null }),
    threadIds.length > 0
      ? supabase
          .from("relay_messages")
          .select("id, thread_id, sender_role, body, created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (threadChallengesResult.error || threadSolutionsResult.error || threadMessagesResult.error) {
    console.error("Failed to load relay thread supporting context", {
      challengeError: threadChallengesResult.error,
      messageError: threadMessagesResult.error,
      solutionError: threadSolutionsResult.error,
    });

    workspaceError =
      workspaceError ??
      "The relay inbox loaded partially, but some supporting challenge or solution context could not be verified.";
  }

  const publicChallengesById = new Map(
    (((threadChallengesResult.data ?? []) as Parameters<typeof mapPublicChallengeRow>[0][]).map(
      mapPublicChallengeRow,
    ) ?? []).map((challenge) => [challenge.id, challenge]),
  );
  const publicSolutionsById = new Map(
    (((threadSolutionsResult.data ?? []) as Parameters<typeof mapPublicSolutionRow>[0][]).map(
      mapPublicSolutionRow,
    ) ?? []).map((solution) => [solution.id, solution]),
  );
  const messagesByThreadId = new Map<string, RelayMessageRecord[]>();

  for (const record of (threadMessagesResult.data ?? []) as RelayMessageRecord[]) {
    const current = messagesByThreadId.get(record.thread_id) ?? [];
    current.push(record);
    messagesByThreadId.set(record.thread_id, current);
  }

  const ownedChallengeIds = new Set(ownedChallenges.map((challenge) => challenge.id));
  const existingResponderThreadByChallengeId = new Map<string, RelayThreadRecord>();

  for (const thread of relayThreadRecords) {
    if (verifiedMembership && thread.responder_membership_id === verifiedMembership.id) {
      existingResponderThreadByChallengeId.set(thread.challenge_id, thread);
    }
  }

  let selectedThreadId = params.threadId;
  let threadMissing = false;
  let responseTarget: RelayResponseTarget | null = null;
  let responseTargetError: string | null = null;

  if (params.challengeSlug) {
    if (!responseTargetResult.data) {
      responseTargetError =
        "That anonymous challenge could not be found, or it is no longer available for public relay response.";
    } else {
      const publicChallenge = mapPublicChallengeRow(
        responseTargetResult.data as Parameters<typeof mapPublicChallengeRow>[0],
      );
      const existingThread = existingResponderThreadByChallengeId.get(publicChallenge.id) ?? null;

      if (existingThread) {
        selectedThreadId = existingThread.id;
      } else if (publicChallenge.anonymityMode !== "anonymous") {
        responseTargetError =
          "Relay is only available on anonymous published challenges in v1.";
      } else if (!verifiedMembership) {
        responseTargetError =
          "A verified company membership is required before you can respond through the protected relay.";
      } else if (ownedChallengeIds.has(publicChallenge.id)) {
        responseTargetError =
          "You already own this anonymous challenge. Use the relay inbox below to continue from the challenge-owner side.";
      } else {
        responseTarget = {
          challengeId: publicChallenge.id,
          challengeSlug: publicChallenge.slug,
          geographyLabel: publicChallenge.geographyLabel,
          sectorLabel: publicChallenge.sectorName,
          summary: publicChallenge.summary,
          title: publicChallenge.title,
        };
      }
    }
  }

  const relayThreadList = relayThreadRecords
    .map((thread) => {
      const perspective = resolvePerspective(thread, membershipIds);

      if (!perspective) {
        return null;
      }

      const challenge = publicChallengesById.get(thread.challenge_id);
      const solution = thread.solution_id ? publicSolutionsById.get(thread.solution_id) ?? null : null;
      const messages = messagesByThreadId.get(thread.id) ?? [];
      const latestMessage = messages[0] ?? null;

      return {
        active: selectedThreadId === thread.id,
        challengeTitle: challenge?.title ?? "Anonymous challenge thread",
        counterpartLabel: getRelayCounterpartLabel({
          perspective,
          solutionCompanyName: solution?.companyName ?? null,
        }),
        href: `/account/challenges?thread=${thread.id}`,
        id: thread.id,
        lastMessageAtLabel: formatRelayTimestamp(latestMessage?.created_at ?? thread.last_message_at),
        lastMessagePreview: latestMessage
          ? truncateRelayPreview(latestMessage.body)
          : challenge?.summary ?? "Protected relay thread",
        linkedSolutionLabel: solution ? solution.title : null,
        perspectiveLabel: perspective === "challenge_owner" ? "Owner view" : "Responder view",
        statusLabel: getRelayThreadStatusLabel(thread.status),
        statusTone: getRelayThreadStatusTone(thread.status),
      } satisfies RelayThreadListItem;
    })
    .filter((item): item is RelayThreadListItem => Boolean(item));

  const selectedThreadRecord = selectedThreadId
    ? relayThreadRecords.find((thread) => thread.id === selectedThreadId) ?? null
    : null;

  if (params.threadId && !selectedThreadRecord) {
    threadMissing = true;
  }

  const selectedThread =
    selectedThreadRecord && resolvePerspective(selectedThreadRecord, membershipIds)
      ? (() => {
          const perspective = resolvePerspective(selectedThreadRecord, membershipIds)!;
          const challenge = publicChallengesById.get(selectedThreadRecord.challenge_id);
          const solution = selectedThreadRecord.solution_id
            ? publicSolutionsById.get(selectedThreadRecord.solution_id) ?? null
            : null;
          const messages = [...(messagesByThreadId.get(selectedThreadRecord.id) ?? [])].sort((left, right) =>
            left.created_at.localeCompare(right.created_at),
          );

          return {
            canReply: selectedThreadRecord.status === "open",
            challengeHref: challenge ? `/challenges/${challenge.slug}` : "/challenges",
            challengeSummary: challenge?.summary ?? "Protected relay thread for an anonymous published challenge.",
            challengeTitle: challenge?.title ?? "Anonymous challenge thread",
            counterpartLabel: getRelayCounterpartLabel({
              perspective,
              solutionCompanyName: solution?.companyName ?? null,
            }),
            id: selectedThreadRecord.id,
            linkedSolutionHref: solution ? `/solutions/${solution.slug}` : null,
            linkedSolutionLabel: solution ? solution.title : null,
            messages: messages.map((message) => ({
              body: message.body,
              createdAtLabel: formatRelayTimestamp(message.created_at),
              id: message.id,
              isOwn:
                (perspective === "challenge_owner" && message.sender_role === "challenge_owner") ||
                (perspective === "responder" && message.sender_role === "responder"),
              senderLabel: getThreadSenderLabel({
                perspective,
                senderRole: message.sender_role,
                solutionCompanyName: solution?.companyName ?? null,
                viewerCompanyName,
              }),
            })),
            perspective,
            statusLabel: getRelayThreadStatusLabel(selectedThreadRecord.status),
            statusTone: getRelayThreadStatusTone(selectedThreadRecord.status),
          } satisfies RelayThreadDetail;
        })()
      : null;

  const threadCountsByChallengeId = new Map<string, number>();

  for (const thread of relayThreadRecords) {
    threadCountsByChallengeId.set(
      thread.challenge_id,
      (threadCountsByChallengeId.get(thread.challenge_id) ?? 0) + 1,
    );
  }

  const ownedChallengeList = ownedChallenges.map((challenge) => ({
    anonymityLabel: challenge.anonymity_mode === "anonymous" ? "Anonymous" : "Named",
    href: `/challenges/${challenge.slug}`,
    id: challenge.id,
    relayThreadCount: threadCountsByChallengeId.get(challenge.id) ?? 0,
    sectorLabel: sectorMap.get(challenge.sector_id) ?? "Governed sector",
    statusLabel: getChallengeStatusLabel(challenge.status),
    statusTone: getChallengeStatusTone(challenge.status),
    title: challenge.title,
    updatedAtLabel: formatChallengeWorkspaceDate(challenge.updated_at),
  }));

  return {
    availableSolutions,
    canInitiateRelay: Boolean(responseTarget && verifiedMembership && !responseTargetError),
    ownedChallenges: ownedChallengeList,
    relayThreads: relayThreadList,
    responseTarget,
    responseTargetError,
    selectedThread,
    statusMessage:
      threadMissing
        ? "That relay thread could not be found. Choose another thread from the inbox."
        : getRelayWorkspaceStatusMessage(params.status),
    threadMissing,
    viewerCompanyName,
    viewerName: viewer.displayName,
    workspaceError,
  };
}
