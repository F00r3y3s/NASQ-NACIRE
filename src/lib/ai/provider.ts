import type {
  AiDraftAssistSeed,
  AiProviderMode,
  DraftAssistSeedInput,
  GroundedAiAnswerInput,
} from "@/lib/ai/contracts";

const LOCAL_VECTOR_SIZE = 64;
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_OPENAI_RESPONSE_MODEL = "gpt-5.4";

type OpenAiProviderEnvironment = {
  apiKey: string;
  baseUrl: string;
  embeddingModel: string;
  responseModel: string;
};

export type NasqAiProvider = {
  embedTexts(texts: string[]): Promise<number[][]>;
  generateDraftSeed(input: DraftAssistSeedInput): Promise<AiDraftAssistSeed>;
  generateGroundedAnswer(input: GroundedAiAnswerInput): Promise<string>;
  mode: AiProviderMode;
};

type OpenAiResponsePayload = {
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    role?: string;
    type?: string;
  }>;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function tokenize(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3);
}

function hashToken(token: string) {
  let hash = 2166136261;

  for (const character of token) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function normalizeVector(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!magnitude) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
}

function buildLocalVector(text: string) {
  const vector = new Array<number>(LOCAL_VECTOR_SIZE).fill(0);

  for (const token of tokenize(text)) {
    const hash = hashToken(token);
    const index = hash % LOCAL_VECTOR_SIZE;
    const sign = hash % 2 === 0 ? 1 : -1;
    const weight = 1 + Math.min(token.length, 12) / 12;

    vector[index] += sign * weight;
  }

  return normalizeVector(vector);
}

function detectPromptGeography(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("mena")) {
    return "MENA";
  }

  if (normalized.includes("global") || normalized.includes("worldwide")) {
    return "Global";
  }

  if (normalized.includes("gcc")) {
    return "UAE + GCC";
  }

  if (normalized.includes("uae")) {
    return "UAE";
  }

  return "UAE + GCC";
}

function detectPromptSector(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("hospital") ||
    normalized.includes("healthcare") ||
    normalized.includes("patient") ||
    normalized.includes("clinical")
  ) {
    return "Healthcare";
  }

  if (
    normalized.includes("logistics") ||
    normalized.includes("port") ||
    normalized.includes("supply chain") ||
    normalized.includes("ramadan")
  ) {
    return "Logistics & Supply Chain";
  }

  if (
    normalized.includes("oil") ||
    normalized.includes("gas") ||
    normalized.includes("refinery") ||
    normalized.includes("energy")
  ) {
    return "Oil & Gas";
  }

  if (
    normalized.includes("police") ||
    normalized.includes("civil defense") ||
    normalized.includes("emergency response")
  ) {
    return "Police & Civil Defense";
  }

  return null;
}

function buildCompactTitle(value: string) {
  const normalized = normalizeText(value).replace(/[?.!]+$/g, "");

  if (normalized.length <= 80) {
    return normalized;
  }

  const truncated = normalized.slice(0, 77);
  const lastSpace = truncated.lastIndexOf(" ");

  return `${(lastSpace > 32 ? truncated.slice(0, lastSpace) : truncated).trim()}...`;
}

function buildLocalGroundedAnswer({
  evidence,
  isSignedIn,
  prompt,
}: GroundedAiAnswerInput) {
  if (evidence.length === 0) {
    return [
      "I could not find a directly matching published platform record for that question yet.",
      "Try broadening the sector language or comparing nearby challenge and solution records. This answer remains limited to public-safe platform data only.",
      isSignedIn
        ? "Your signed-in thread is still saved, so you can refine the question and continue from here."
        : "This public discovery thread stays on this device, so you can refine the question and continue from here.",
    ].join("\n\n");
  }

  const leadEvidence = evidence[0]!;
  const supportingTitles = evidence
    .map((item) => `${item.title} (${item.recordType})`)
    .join(", ");
  const privacyNote = evidence.some(
    (item) => item.recordType === "challenge" && item.companyName === "Anonymous",
  )
    ? "One of the cited challenge records is anonymized in the same public-safe way it appears elsewhere on the platform."
    : "All cited records below come from published public-safe platform data.";

  return [
    `I found ${evidence.length} relevant published platform record${
      evidence.length === 1 ? "" : "s"
    } for this question. The strongest signal is ${leadEvidence.title}, which sits in ${leadEvidence.sectorName} and aligns closely with the prompt: "${normalizeText(prompt)}".`,
    `Supporting platform evidence includes ${supportingTitles}. ${privacyNote}`,
    isSignedIn
      ? "Because you are signed in, this grounded answer is saved in your private continuity thread and can be turned into a challenge draft."
      : "This grounded answer stays inside public discovery mode and cites only internal platform records.",
  ].join("\n\n");
}

function buildLocalDraftSeed({
  conversationTitle,
  evidence,
  transcript,
}: DraftAssistSeedInput): AiDraftAssistSeed {
  const latestUserMessage =
    [...transcript].reverse().find((turn) => turn.role === "user")?.content ??
    conversationTitle;
  const dominantSector =
    evidence[0]?.sectorName ?? detectPromptSector(latestUserMessage) ?? null;
  const geographyLabel = detectPromptGeography(
    [conversationTitle, ...transcript.map((turn) => turn.content)].join(" "),
  );
  const relatedTitles = evidence.map((item) => item.title).join(", ");

  return {
    anonymityMode: "named",
    desiredOutcome: normalizeText(
      `Identify an editable challenge path for ${conversationTitle.toLowerCase()} with measurable coordination improvements across ${dominantSector?.toLowerCase() ?? "the target sector"}.`,
    ).slice(0, 600),
    geographyLabel,
    problemStatement: normalizeText(
      `${latestUserMessage} Existing public platform evidence points to related records such as ${relatedTitles || "nearby published records"}, which suggests the issue is already visible across published platform activity and deserves a structured challenge submission.`,
    ),
    sectorName: dominantSector,
    summary: normalizeText(
      `${buildCompactTitle(conversationTitle)} remains an operational issue. The current AI thread and cited platform records show enough public-safe context to seed an editable challenge draft.`,
    ).slice(0, 280),
    title: buildCompactTitle(conversationTitle || latestUserMessage),
  };
}

function readOpenAiProviderEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): OpenAiProviderEnvironment | null {
  const apiKey = normalizeText(source.OPENAI_API_KEY);

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: normalizeText(source.OPENAI_BASE_URL) || DEFAULT_OPENAI_BASE_URL,
    embeddingModel:
      normalizeText(source.NASQ_AI_EMBEDDING_MODEL) || DEFAULT_OPENAI_EMBEDDING_MODEL,
    responseModel:
      normalizeText(source.NASQ_AI_RESPONSE_MODEL) || DEFAULT_OPENAI_RESPONSE_MODEL,
  };
}

function extractOpenAiOutputText(payload: OpenAiResponsePayload) {
  return (payload.output ?? [])
    .flatMap((outputItem) =>
      outputItem.type === "message" && outputItem.role === "assistant"
        ? (outputItem.content ?? [])
            .filter((part) => part.type === "output_text" && typeof part.text === "string")
            .map((part) => part.text ?? "")
        : [],
    )
    .join("")
    .trim();
}

async function callOpenAiJson<T>({
  environment,
  instructions,
  maxOutputTokens = 500,
  payload,
}: {
  environment: OpenAiProviderEnvironment;
  instructions: string;
  maxOutputTokens?: number;
  payload: string;
}) {
  const response = await fetch(`${environment.baseUrl}/responses`, {
    body: JSON.stringify({
      input: [
        {
          content: instructions,
          role: "developer",
        },
        {
          content: payload,
          role: "user",
        },
      ],
      max_output_tokens: maxOutputTokens,
      model: environment.responseModel,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${environment.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`OpenAI responses request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as OpenAiResponsePayload;
  const outputText = extractOpenAiOutputText(data);

  if (!outputText) {
    throw new Error("OpenAI responses request returned no assistant text.");
  }

  return JSON.parse(outputText) as T;
}

function createLocalNasqAiProviderInternal(): NasqAiProvider {
  return {
    async embedTexts(texts) {
      return texts.map((text) => buildLocalVector(text));
    },
    async generateDraftSeed(input) {
      return buildLocalDraftSeed(input);
    },
    async generateGroundedAnswer(input) {
      return buildLocalGroundedAnswer(input);
    },
    mode: "local",
  };
}

function createOpenAiNasqProvider(environment: OpenAiProviderEnvironment): NasqAiProvider {
  const localProvider = createLocalNasqAiProviderInternal();

  return {
    async embedTexts(texts) {
      try {
        const response = await fetch(`${environment.baseUrl}/embeddings`, {
          body: JSON.stringify({
            encoding_format: "float",
            input: texts,
            model: environment.embeddingModel,
          }),
          headers: {
            Authorization: `Bearer ${environment.apiKey}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`OpenAI embeddings request failed with status ${response.status}.`);
        }

        const data = (await response.json()) as {
          data?: Array<{ embedding?: number[] }>;
        };
        const embeddings = (data.data ?? []).map((item) => item.embedding ?? []);

        if (embeddings.length !== texts.length || embeddings.some((item) => item.length === 0)) {
          throw new Error("OpenAI embeddings returned an unexpected shape.");
        }

        return embeddings;
      } catch (error) {
        console.error("Falling back to local embeddings after OpenAI failure", error);
        return localProvider.embedTexts(texts);
      }
    },
    async generateDraftSeed(input) {
      try {
        const draftSeed = await callOpenAiJson<AiDraftAssistSeed>({
          environment,
          instructions:
            "Return JSON only. Create an editable challenge draft seed using only the supplied transcript and evidence. Keep anonymityMode as named. Never invent sectors or claims outside the supplied evidence.",
          payload: JSON.stringify({
            conversationTitle: input.conversationTitle,
            evidence: input.evidence.map((item) => ({
              recordType: item.recordType,
              sectorName: item.sectorName,
              summary: item.summary,
              title: item.title,
            })),
            transcript: input.transcript,
          }),
        });

        return {
          anonymityMode: "named",
          desiredOutcome: normalizeText(draftSeed.desiredOutcome),
          geographyLabel: normalizeText(draftSeed.geographyLabel),
          problemStatement: normalizeText(draftSeed.problemStatement),
          sectorName: normalizeText(draftSeed.sectorName),
          summary: normalizeText(draftSeed.summary),
          title: buildCompactTitle(draftSeed.title),
        };
      } catch (error) {
        console.error("Falling back to local draft assist after OpenAI failure", error);
        return localProvider.generateDraftSeed(input);
      }
    },
    async generateGroundedAnswer(input) {
      try {
        const result = await callOpenAiJson<{ answer: string }>({
          environment,
          instructions:
            "Return JSON only with an answer field. Write a concise grounded answer using only the supplied internal platform evidence. Do not invent companies, sectors, citations, or external knowledge.",
          payload: JSON.stringify({
            evidence: input.evidence.map((item) => ({
              companyName: item.companyName,
              recordType: item.recordType,
              sectorName: item.sectorName,
              summary: item.summary,
              title: item.title,
            })),
            isSignedIn: input.isSignedIn,
            prompt: input.prompt,
          }),
        });

        return normalizeText(result.answer) || localProvider.generateGroundedAnswer(input);
      } catch (error) {
        console.error("Falling back to local grounded answer after OpenAI failure", error);
        return localProvider.generateGroundedAnswer(input);
      }
    },
    mode: "openai",
  };
}

export function createLocalNasqAiProvider() {
  return createLocalNasqAiProviderInternal();
}

export function resolveNasqAiProvider(
  source: NodeJS.ProcessEnv = process.env,
): NasqAiProvider {
  const environment = readOpenAiProviderEnvironment(source);

  if (!environment) {
    return createLocalNasqAiProviderInternal();
  }

  return createOpenAiNasqProvider(environment);
}
