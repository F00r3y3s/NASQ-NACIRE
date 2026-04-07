import type { AIMessageCitation } from "@/domain/models";

export type AiConversationTranscriptTurn = {
  content: string;
  role: "assistant" | "user";
};

export type AiProviderMode = "local" | "openai";

export type AiRetrievalDocument = {
  companyName: string;
  content: string;
  publishedAt: string | null;
  recordId: string;
  recordType: AIMessageCitation["recordType"];
  route: string;
  sectorId: string;
  sectorName: string;
  summary: string;
  title: string;
};

export type AiEvidenceMatch = {
  citation: AIMessageCitation;
  companyName: string;
  recordType: AIMessageCitation["recordType"];
  score: number;
  sectorId: string;
  sectorName: string;
  summary: string;
  title: string;
};

export type AiDraftAssistSeed = {
  anonymityMode: "named";
  desiredOutcome: string;
  geographyLabel: string;
  problemStatement: string;
  sectorName: string | null;
  summary: string;
  title: string;
};

export type GroundedAiAnswerInput = {
  evidence: AiEvidenceMatch[];
  isSignedIn: boolean;
  prompt: string;
};

export type DraftAssistSeedInput = {
  conversationTitle: string;
  evidence: AiEvidenceMatch[];
  transcript: AiConversationTranscriptTurn[];
};
