import type { ViewerMembershipSummary } from "@/lib/auth/access";
import type { ChallengeDraft, ISODateTimeString } from "@/domain/models";
import type { PublicSectorRecord } from "@/domain/public-records";
import { publicReadModelCatalog } from "@/domain/public-records";
import { sectorSeeds } from "@/domain/sectors";
import {
  calculateChallengeSubmissionCompletion,
  createEmptyChallengeSubmissionInput,
  normalizeChallengeSubmissionInput,
  selectChallengeSubmissionMembership,
  type ChallengeSubmissionInput,
} from "@/lib/challenges/submission";
import { getCurrentViewer } from "@/lib/auth/server";
import { readSupabasePublicEnvironment } from "@/config/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { mapPublicSectorRow } from "./public-record-mappers";

type ChallengeDraftRecord = {
  anonymity_mode: "named" | "anonymous";
  created_at: ISODateTimeString;
  desired_outcome: string | null;
  geography_label: string | null;
  id: string;
  owner_membership_id: string;
  problem_statement: string | null;
  sector_id: string | null;
  source_conversation_id: string | null;
  status: ChallengeDraft["status"];
  submitted_challenge_id: string | null;
  summary: string | null;
  title: string | null;
  updated_at: ISODateTimeString;
};

export type ChallengeEditorSectorOption = Pick<
  PublicSectorRecord,
  "description" | "id" | "name" | "slug"
>;

export type ChallengeEditorDraftSummary = {
  completion: ReturnType<typeof calculateChallengeSubmissionCompletion>;
  createdAt: string;
  id: string;
  input: ChallengeSubmissionInput;
  sourceConversationId: string | null;
  status: ChallengeDraft["status"];
  submittedChallengeId: string | null;
  updatedAt: string;
};

export type ChallengeEditorPageData = {
  companyName: string | null;
  currentDraft: ChallengeEditorDraftSummary | null;
  latestDraft: ChallengeEditorDraftSummary | null;
  sectors: ChallengeEditorSectorOption[];
  viewerName: string;
  workspaceError: string | null;
};

function mapChallengeDraftRecord(record: ChallengeDraftRecord): ChallengeEditorDraftSummary {
  const input = normalizeChallengeSubmissionInput({
    anonymityMode: record.anonymity_mode,
    desiredOutcome: record.desired_outcome,
    draftId: record.id,
    geographyLabel: record.geography_label,
    problemStatement: record.problem_statement,
    sectorId: record.sector_id,
    sourceConversationId: record.source_conversation_id,
    summary: record.summary,
    title: record.title,
  });

  return {
    completion: calculateChallengeSubmissionCompletion(input),
    createdAt: record.created_at,
    id: record.id,
    input,
    sourceConversationId: record.source_conversation_id,
    status: record.status,
    submittedChallengeId: record.submitted_challenge_id,
    updatedAt: record.updated_at,
  };
}

function createFallbackSectors(): ChallengeEditorSectorOption[] {
  return sectorSeeds.map((sector) => ({
    description: sector.description,
    id: sector.slug,
    name: sector.name,
    slug: sector.slug,
  }));
}

export function formatEditorDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function getChallengeDraftStatusLabel(status: ChallengeDraft["status"]) {
  if (status === "submitted") {
    return "Submitted to review";
  }

  if (status === "archived") {
    return "Archived";
  }

  return "In progress";
}

function createWorkspaceError(
  membership: ViewerMembershipSummary | null,
) {
  if (!membership) {
    return "A verified company membership is required before you can save or submit a challenge.";
  }

  if (!membership.company) {
    return "Your verified membership does not have an active company profile attached yet.";
  }

  return null;
}

export async function getChallengeEditorPageData({
  draftId,
}: {
  draftId?: string;
} = {}): Promise<ChallengeEditorPageData & { draftMissing: boolean }> {
  const viewer = await getCurrentViewer();
  const membership = selectChallengeSubmissionMembership(viewer.memberships);
  const workspaceError = createWorkspaceError(membership);
  const env = readSupabasePublicEnvironment();

  if (!env || !membership) {
    return {
      companyName: membership?.company?.name ?? viewer.primaryCompany?.name ?? null,
      currentDraft: null,
      draftMissing: Boolean(draftId),
      latestDraft: null,
      sectors: createFallbackSectors(),
      viewerName: viewer.displayName,
      workspaceError,
    };
  }

  const supabase = await getSupabaseServerClient();
  const [sectorsResult, latestDraftResult, currentDraftResult] = await Promise.all([
    supabase
      .from(publicReadModelCatalog.publicSectors)
      .select("*")
      .order("display_order", { ascending: true }),
    supabase
      .from("challenge_drafts")
      .select("*")
      .eq("owner_membership_id", membership.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    draftId
      ? supabase
          .from("challenge_drafts")
          .select("*")
          .eq("id", draftId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

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

  const latestDraft =
    latestDraftResult.data && !latestDraftResult.error
      ? mapChallengeDraftRecord(latestDraftResult.data as ChallengeDraftRecord)
      : null;
  const currentDraft =
    currentDraftResult.data && !currentDraftResult.error
      ? mapChallengeDraftRecord(currentDraftResult.data as ChallengeDraftRecord)
      : null;

  return {
    companyName: membership.company?.name ?? viewer.primaryCompany?.name ?? null,
    currentDraft,
    draftMissing: Boolean(draftId) && currentDraft === null,
    latestDraft,
    sectors,
    viewerName: viewer.displayName,
    workspaceError,
  };
}

export function getSubmissionStatusMessage(status: string | null | undefined) {
  if (status === "draft-saved") {
    return "Draft saved. You can resume editing anytime from this route.";
  }

  if (status === "ai-seeded") {
    return "AI draft prepared. Review the structured fields, refine anything needed, and then save or submit for review.";
  }

  if (status === "submitted") {
    return "Challenge submitted for review. The draft snapshot is now locked while moderation is pending.";
  }

  return null;
}

export function getInitialChallengeSubmissionInput(
  draft: ChallengeEditorDraftSummary | null,
) {
  return draft?.input ?? createEmptyChallengeSubmissionInput();
}
