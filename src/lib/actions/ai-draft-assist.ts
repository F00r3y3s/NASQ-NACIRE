"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import { collectAiCitationRecordIds, normalizeAiMessageCitations } from "@/lib/ai/citations";
import type { AiConversationTranscriptTurn, AiEvidenceMatch } from "@/lib/ai/contracts";
import { resolveNasqAiProvider } from "@/lib/ai/provider";
import { createDraftAssistInput } from "@/lib/ai/retrieval";
import {
  buildAiRetrievalDocuments,
} from "@/lib/ai/retrieval";
import {
  buildChallengeDraftMutation,
  selectChallengeSubmissionMembership,
} from "@/lib/challenges/submission";
import { publicReadModelCatalog } from "@/domain/public-records";
import { mapPublicChallengeRow, mapPublicSectorRow, mapPublicSolutionRow } from "@/lib/data/public-record-mappers";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ConversationRecord = {
  id: string;
  title: string | null;
};

type MessageRecord = {
  citations: unknown[];
  content: string;
  role: "assistant" | "user";
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function loadConversation({
  conversationId,
  supabase,
  userId,
}: {
  conversationId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  userId: string;
}) {
  const result = await supabase
    .from("ai_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return (result.data as ConversationRecord | null) ?? null;
}

async function loadConversationMessages({
  conversationId,
  supabase,
}: {
  conversationId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const result = await supabase
    .from("ai_messages")
    .select("role, content, citations")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []) as MessageRecord[];
}

async function loadEvidenceMatches({
  challengeIds,
  solutionIds,
  supabase,
}: {
  challengeIds: string[];
  solutionIds: string[];
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const [challengeResult, solutionResult] = await Promise.all([
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
  ]);

  if (challengeResult.error) {
    throw challengeResult.error;
  }

  if (solutionResult.error) {
    throw solutionResult.error;
  }

  const documents = buildAiRetrievalDocuments({
    challenges: (challengeResult.data ?? []).map((row) =>
      mapPublicChallengeRow(row as Parameters<typeof mapPublicChallengeRow>[0]),
    ),
    solutions: (solutionResult.data ?? []).map((row) =>
      mapPublicSolutionRow(row as Parameters<typeof mapPublicSolutionRow>[0]),
    ),
  });

  return documents.map(
    (document) =>
      ({
        citation: {
          href: document.route,
          label: `${document.recordType === "challenge" ? "Challenge" : "Solution"}: ${
            document.title
          }`,
          recordId: document.recordId,
          recordType: document.recordType,
        },
        companyName: document.companyName,
        recordType: document.recordType,
        score: 1,
        sectorId: document.sectorId,
        sectorName: document.sectorName,
        summary: document.summary,
        title: document.title,
      }) satisfies AiEvidenceMatch,
  );
}

async function loadSectorOptions(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
) {
  const result = await supabase
    .from(publicReadModelCatalog.publicSectors)
    .select("*")
    .order("display_order", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) =>
    mapPublicSectorRow(row as Parameters<typeof mapPublicSectorRow>[0]),
  );
}

function createRedirectStatusHref({
  conversationId,
  status,
}: {
  conversationId: string;
  status: string;
}) {
  return `/ai?conversation=${conversationId}&status=${status}`;
}

export async function createChallengeDraftFromConversationAction(formData: FormData) {
  const conversationId = readFormText(formData, "conversationId");

  if (!conversationId) {
    redirect("/ai?status=draft_failed");
  }

  if (!readSupabasePublicEnvironment()) {
    redirect(createRedirectStatusHref({ conversationId, status: "draft_failed" }) as Route);
  }

  const viewer = await getCurrentViewer();
  const membership = selectChallengeSubmissionMembership(viewer.memberships);

  if (viewer.status !== "authenticated" || !viewer.userId || !membership?.company) {
    redirect(createRedirectStatusHref({ conversationId, status: "draft_failed" }) as Route);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const conversation = await loadConversation({
      conversationId,
      supabase,
      userId: viewer.userId,
    });

    if (!conversation) {
      redirect(createRedirectStatusHref({ conversationId, status: "draft_failed" }) as Route);
    }

    const messages = await loadConversationMessages({
      conversationId,
      supabase,
    });

    const transcript = messages.map(
      (message) =>
        ({
          content: message.content,
          role: message.role,
        }) satisfies AiConversationTranscriptTurn,
    );
    const citations = messages.flatMap((message) => normalizeAiMessageCitations(message.citations));
    const citedRecordIds = collectAiCitationRecordIds(citations);
    const evidence = await loadEvidenceMatches({
      challengeIds: [...citedRecordIds.challengeIds],
      solutionIds: [...citedRecordIds.solutionIds],
      supabase,
    });
    const sectors = await loadSectorOptions(supabase);
    const provider = resolveNasqAiProvider();
    const input = await createDraftAssistInput({
      conversationId,
      conversationTitle:
        conversation.title ?? transcript.find((item) => item.role === "user")?.content ?? "AI draft",
      evidence,
      provider,
      sectors,
      transcript,
    });
    const existingDraftResult = await supabase
      .from("challenge_drafts")
      .select("id")
      .eq("owner_membership_id", membership.id)
      .eq("source_conversation_id", conversationId)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingDraftResult.error) {
      throw existingDraftResult.error;
    }

    const payload = buildChallengeDraftMutation({
      input,
      ownerMembershipId: membership.id,
      status: "draft",
    });
    const draftResult = existingDraftResult.data
      ? await supabase
          .from("challenge_drafts")
          .update(payload)
          .eq("id", existingDraftResult.data.id)
          .select("id")
          .single()
      : await supabase
          .from("challenge_drafts")
          .insert(payload)
          .select("id")
          .single();

    if (draftResult.error) {
      throw draftResult.error;
    }

    const draftId = (draftResult.data as { id: string }).id;

    revalidatePath("/ai");
    revalidatePath("/submit");
    revalidatePath(`/drafts/${draftId}`);
    redirect(`/drafts/${draftId}?status=ai-seeded`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("AI draft assist failed", error);
    redirect(createRedirectStatusHref({ conversationId, status: "draft_failed" }) as Route);
  }
}
