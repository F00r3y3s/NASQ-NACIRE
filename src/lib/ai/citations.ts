import type { AIMessageCitation } from "@/domain/models";

function isCitationRecordType(value: unknown): value is AIMessageCitation["recordType"] {
  return value === "challenge" || value === "solution";
}

export function normalizeAiMessageCitations(value: unknown): AIMessageCitation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const citation = item as Record<string, unknown>;

    if (
      typeof citation.href !== "string" ||
      typeof citation.label !== "string" ||
      typeof citation.recordId !== "string" ||
      !isCitationRecordType(citation.recordType)
    ) {
      return [];
    }

    return [
      {
        href: citation.href,
        label: citation.label,
        recordId: citation.recordId,
        recordType: citation.recordType,
      },
    ];
  });
}

export function collectAiCitationRecordIds(citations: AIMessageCitation[]) {
  return citations.reduce(
    (accumulator, citation) => {
      if (citation.recordType === "challenge") {
        accumulator.challengeIds.add(citation.recordId);
      } else {
        accumulator.solutionIds.add(citation.recordId);
      }

      return accumulator;
    },
    {
      challengeIds: new Set<string>(),
      solutionIds: new Set<string>(),
    },
  );
}
