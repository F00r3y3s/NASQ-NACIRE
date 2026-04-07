import type {
  PublicChallengeRecord,
  PublicSectorRecord,
  PublicSolutionRecord,
} from "@/domain/public-records";
import type { ChallengeSubmissionInput } from "@/lib/challenges/submission";
import { normalizeChallengeSubmissionInput } from "@/lib/challenges/submission";
import type {
  AiConversationTranscriptTurn,
  AiDraftAssistSeed,
  AiEvidenceMatch,
  AiRetrievalDocument,
} from "@/lib/ai/contracts";
import type { NasqAiProvider } from "@/lib/ai/provider";

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function tokenize(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
}

function buildChallengeDocument(record: PublicChallengeRecord): AiRetrievalDocument {
  const content = [
    record.title,
    record.summary,
    record.problemStatement,
    record.desiredOutcome ?? "",
    record.sectorName,
    record.geographyLabel ?? "",
    record.companyName,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    companyName: record.companyName,
    content,
    publishedAt: record.publishedAt,
    recordId: record.id,
    recordType: "challenge",
    route: `/challenges/${record.slug}`,
    sectorId: record.sectorId,
    sectorName: record.sectorName,
    summary: record.summary,
    title: record.title,
  };
}

function buildSolutionDocument(record: PublicSolutionRecord): AiRetrievalDocument {
  const content = [
    record.title,
    record.summary,
    record.offeringDescription,
    record.sectorName,
    record.coverageLabel ?? "",
    record.companyName,
    record.accessModel,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    companyName: record.companyName,
    content,
    publishedAt: record.publishedAt,
    recordId: record.id,
    recordType: "solution",
    route: `/solutions/${record.slug}`,
    sectorId: record.sectorId,
    sectorName: record.sectorName,
    summary: record.summary,
    title: record.title,
  };
}

function calculateLexicalScore(prompt: string, document: AiRetrievalDocument) {
  const promptTokens = tokenize(prompt);
  const haystack = `${document.title}\n${document.summary}\n${document.content}`.toLowerCase();

  return promptTokens.reduce((score, token) => {
    if (document.title.toLowerCase().includes(token)) {
      return score + 4;
    }

    if (document.summary.toLowerCase().includes(token)) {
      return score + 2;
    }

    if (haystack.includes(token)) {
      return score + 1;
    }

    return score;
  }, 0);
}

function normalizeLexicalScore(value: number) {
  return Math.min(value / 16, 1);
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}

function compareByPublishedAt(left: AiRetrievalDocument, right: AiRetrievalDocument) {
  return (right.publishedAt ?? "").localeCompare(left.publishedAt ?? "");
}

function inferSectorName({
  evidence,
  seed,
}: {
  evidence: AiEvidenceMatch[];
  seed: AiDraftAssistSeed;
}) {
  if (seed.sectorName) {
    return seed.sectorName;
  }

  return evidence[0]?.sectorName ?? null;
}

function resolveSectorId({
  evidence,
  sectorName,
  sectors,
}: {
  evidence: AiEvidenceMatch[];
  sectorName: string | null;
  sectors: Pick<PublicSectorRecord, "description" | "id" | "name" | "slug">[];
}) {
  const normalizedSectorName = sectorName?.toLowerCase() ?? "";

  if (normalizedSectorName) {
    const directMatch = sectors.find(
      (sector) =>
        sector.name.toLowerCase() === normalizedSectorName ||
        sector.slug.toLowerCase() === normalizedSectorName,
    );

    if (directMatch) {
      return directMatch.id;
    }
  }

  return evidence[0]?.sectorId ?? sectors[0]?.id ?? "";
}

export function buildAiRetrievalDocuments({
  challenges,
  solutions,
}: {
  challenges: PublicChallengeRecord[];
  solutions: PublicSolutionRecord[];
}) {
  return [
    ...challenges.map(buildChallengeDocument),
    ...solutions.map(buildSolutionDocument),
  ].sort(compareByPublishedAt);
}

export async function selectAiEvidenceMatches({
  documents,
  maxResults = 3,
  prompt,
  provider,
}: {
  documents: AiRetrievalDocument[];
  maxResults?: number;
  prompt: string;
  provider: NasqAiProvider;
}) {
  if (documents.length === 0) {
    return [] as AiEvidenceMatch[];
  }

  const shortlisted = [...documents]
    .map((document) => ({
      document,
      lexicalScore: calculateLexicalScore(prompt, document),
    }))
    .sort((left, right) => {
      if (right.lexicalScore !== left.lexicalScore) {
        return right.lexicalScore - left.lexicalScore;
      }

      return compareByPublishedAt(left.document, right.document);
    })
    .slice(0, Math.min(12, documents.length));

  const [queryVector, ...documentVectors] = await provider.embedTexts([
    prompt,
    ...shortlisted.map((item) => item.document.content),
  ]);

  return shortlisted
    .map((item, index) => {
      const vectorScore = cosineSimilarity(queryVector ?? [], documentVectors[index] ?? []);
      const score = vectorScore * 0.72 + normalizeLexicalScore(item.lexicalScore) * 0.28;

      return {
        citation: {
          href: item.document.route,
          label: `${item.document.recordType === "challenge" ? "Challenge" : "Solution"}: ${
            item.document.title
          }`,
          recordId: item.document.recordId,
          recordType: item.document.recordType,
        },
        companyName: item.document.companyName,
        recordType: item.document.recordType,
        score,
        sectorId: item.document.sectorId,
        sectorName: item.document.sectorName,
        summary: item.document.summary,
        title: item.document.title,
      } satisfies AiEvidenceMatch;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, maxResults);
}

export async function createDraftAssistInput({
  conversationId,
  conversationTitle,
  evidence,
  provider,
  sectors,
  transcript,
}: {
  conversationId: string;
  conversationTitle: string;
  evidence: AiEvidenceMatch[];
  provider: NasqAiProvider;
  sectors: Pick<PublicSectorRecord, "description" | "id" | "name" | "slug">[];
  transcript: AiConversationTranscriptTurn[];
}): Promise<ChallengeSubmissionInput> {
  const seed = await provider.generateDraftSeed({
    conversationTitle,
    evidence,
    transcript,
  });
  const sectorName = inferSectorName({ evidence, seed });
  const sectorId = resolveSectorId({
    evidence,
    sectorName,
    sectors,
  });

  return normalizeChallengeSubmissionInput({
    anonymityMode: seed.anonymityMode,
    desiredOutcome: seed.desiredOutcome,
    draftId: "",
    geographyLabel: seed.geographyLabel,
    problemStatement: seed.problemStatement,
    sectorId,
    sourceConversationId: conversationId,
    summary: seed.summary,
    title: seed.title,
  });
}
