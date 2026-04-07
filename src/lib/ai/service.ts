import type { SupabaseClient } from "@supabase/supabase-js";

import { publicReadModelCatalog } from "@/domain/public-records";
import {
  mapPublicChallengeRow,
  mapPublicSolutionRow,
} from "@/lib/data/public-record-mappers";
import { resolveNasqAiProvider } from "@/lib/ai/provider";
import {
  buildAiRetrievalDocuments,
  selectAiEvidenceMatches,
} from "@/lib/ai/retrieval";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof getSupabaseServerClient>>;

type PublicChallengeRow = Parameters<typeof mapPublicChallengeRow>[0];
type PublicSolutionRow = Parameters<typeof mapPublicSolutionRow>[0];

export type GroundedAiTurnResult = {
  assistantReply: string;
  citations: import("@/domain/models").AIMessageCitation[];
  providerMode: import("@/lib/ai/contracts").AiProviderMode;
};

async function loadAiCorpus(supabase: SupabaseClient) {
  const [challengesResult, solutionsResult] = await Promise.all([
    supabase
      .from(publicReadModelCatalog.publicChallenges)
      .select("*")
      .order("published_at", { ascending: false })
      .limit(24),
    supabase
      .from(publicReadModelCatalog.publicSolutions)
      .select("*")
      .order("published_at", { ascending: false })
      .limit(24),
  ]);

  const challenges =
    challengesResult.error || !challengesResult.data
      ? []
      : (challengesResult.data as PublicChallengeRow[]).map(mapPublicChallengeRow);
  const solutions =
    solutionsResult.error || !solutionsResult.data
      ? []
      : (solutionsResult.data as PublicSolutionRow[]).map(mapPublicSolutionRow);

  if (challengesResult.error || solutionsResult.error) {
    console.error("AI retrieval corpus failed to load cleanly", {
      challengesError: challengesResult.error,
      solutionsError: solutionsResult.error,
    });
  }

  return buildAiRetrievalDocuments({
    challenges,
    solutions,
  });
}

export async function generateGroundedAiTurn({
  isSignedIn,
  prompt,
  supabase,
}: {
  isSignedIn: boolean;
  prompt: string;
  supabase: ServerSupabaseClient;
}): Promise<GroundedAiTurnResult> {
  const provider = resolveNasqAiProvider();
  const documents = await loadAiCorpus(supabase);
  const evidence = await selectAiEvidenceMatches({
    documents,
    maxResults: 3,
    prompt,
    provider,
  });
  const assistantReply = await provider.generateGroundedAnswer({
    evidence,
    isSignedIn,
    prompt,
  });

  return {
    assistantReply,
    citations: evidence.map((item) => item.citation),
    providerMode: provider.mode,
  };
}
