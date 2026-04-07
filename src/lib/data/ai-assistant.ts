import { cookies } from "next/headers";

import { readSupabasePublicEnvironment } from "@/config/env";
import type { AIConversationScope, AIMessageRole } from "@/domain/contracts";
import type { AIMessageCitation } from "@/domain/models";
import { getCurrentViewer } from "@/lib/auth/server";
import { normalizeAiMessageCitations } from "@/lib/ai/citations";
import {
  aiSuggestedPrompts,
  getAiConversationStatusMessage,
  guestAiSessionCookieName,
  normalizeAiAssistantSearchParams,
} from "@/lib/ai/conversations";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

type AiConversationRecord = {
  access_scope: AIConversationScope;
  created_at: string;
  id: string;
  last_message_at: string | null;
  title: string | null;
  updated_at: string;
};

type AiConversationRpcRecord = {
  access_scope: AIConversationScope;
  created_at: string;
  id: string;
  last_message_at: string | null;
  title: string | null;
  updated_at: string;
};

type AiMessageRecord = {
  citations: unknown[];
  content: string;
  created_at: string;
  id: string;
  role: AIMessageRole;
};

type AiMessageRpcRecord = {
  citations: unknown[];
  content: string;
  created_at: string;
  id: string;
  role: AIMessageRole;
};

type AiBadge = {
  label: string;
  tone: "blue" | "gold" | "green" | "red" | "teal";
};

export type AiConversationSummary = {
  active: boolean;
  href: string;
  id: string;
  lastMessageAtLabel: string;
  scopeLabel: string;
  title: string;
  updatedAtLabel: string;
};

export type AiMessageItem = {
  avatarLabel: string;
  body: string;
  citations: AIMessageCitation[];
  createdAtLabel: string;
  id: string;
  role: AIMessageRole;
  senderLabel: string;
};

export type AiAssistantPageData = {
  badges: AiBadge[];
  canCreateDraftFromConversation: boolean;
  composerDisabled: boolean;
  composerInitialPrompt: string;
  conversationMissing: boolean;
  conversations: AiConversationSummary[];
  currentConversationId: string | null;
  currentConversationTitle: string;
  draftAssistHint: string | null;
  emptyStateCopy: string;
  messages: AiMessageItem[];
  statusMessage: string | null;
  suggestedPrompts: readonly string[];
  viewerModeLabel: string;
  viewerStatusText: string;
  workspaceError: string | null;
};

function formatConversationDate(value: string | null) {
  if (!value) {
    return "Awaiting activity";
  }

  return new Date(value).toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

function getScopeLabel(scope: AIConversationScope) {
  return scope === "member_private" ? "Private continuity" : "Public discovery";
}

function mapConversationSummary({
  activeConversationId,
  record,
}: {
  activeConversationId: string | null;
  record: AiConversationRecord | AiConversationRpcRecord;
}): AiConversationSummary {
  return {
    active: activeConversationId === record.id,
    href: `/ai?conversation=${record.id}`,
    id: record.id,
    lastMessageAtLabel: formatConversationDate(record.last_message_at),
    scopeLabel: getScopeLabel(record.access_scope),
    title: record.title ?? "Untitled conversation",
    updatedAtLabel: formatConversationDate(record.updated_at),
  };
}

function mapMessageItem({
  message,
  viewerInitials,
}: {
  message: AiMessageRecord | AiMessageRpcRecord;
  viewerInitials: string;
}): AiMessageItem {
  const isAssistant = message.role === "assistant";

  return {
    avatarLabel: isAssistant ? "AI" : viewerInitials,
    body: message.content,
    citations: normalizeAiMessageCitations(message.citations),
    createdAtLabel: formatConversationDate(message.created_at),
    id: message.id,
    role: message.role,
    senderLabel: isAssistant ? "NASQ AI" : "You",
  };
}

export async function getAiAssistantPageData(
  searchParams: Promise<SearchParamsRecord> | SearchParamsRecord,
): Promise<AiAssistantPageData> {
  const viewer = await getCurrentViewer();
  const params = normalizeAiAssistantSearchParams(await searchParams);
  const env = readSupabasePublicEnvironment();
  const cookieStore = await cookies();
  const guestSessionKey = cookieStore.get(guestAiSessionCookieName)?.value ?? null;

  if (!env) {
    return {
      badges: [
        { label: "Public Discovery", tone: "green" },
        { label: "Setup Required", tone: "gold" },
      ],
      canCreateDraftFromConversation: false,
      composerDisabled: true,
      composerInitialPrompt: params.prompt,
      conversationMissing: false,
      conversations: [],
      currentConversationId: null,
      currentConversationTitle: "NASQ AI Assistant",
      draftAssistHint:
        viewer.status === "authenticated"
          ? "Connect Supabase before AI draft assist can create editable challenge drafts."
          : null,
      emptyStateCopy:
        "Connect Supabase to activate persisted AI continuity for public and signed-in users.",
      messages: [],
      statusMessage: getAiConversationStatusMessage(params.status),
      suggestedPrompts: aiSuggestedPrompts,
      viewerModeLabel:
        viewer.status === "authenticated" ? "Signed-in continuity" : "Public discovery",
      viewerStatusText:
        viewer.status === "authenticated"
          ? "Signed in, but persistence is waiting on setup"
          : "Public preview waiting on setup",
      workspaceError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable AI conversations.",
    };
  }

  const supabase = await getSupabaseServerClient();
  let workspaceError: string | null = null;
  let conversations: (AiConversationRecord | AiConversationRpcRecord)[] = [];

  if (viewer.status === "authenticated") {
    const result = await supabase
      .from("ai_conversations")
      .select("id, title, access_scope, last_message_at, created_at, updated_at")
      .eq("owner_user_id", viewer.userId)
      .order("updated_at", { ascending: false })
      .limit(12);

    if (result.error) {
      console.error("Failed to load signed-in AI conversations", result.error);
      workspaceError =
        "The AI assistant shell is live, but signed-in conversation history could not be loaded right now.";
    } else {
      conversations = (result.data ?? []) as AiConversationRecord[];
    }
  } else if (guestSessionKey) {
    const result = await supabase.rpc("list_guest_ai_conversations", {
      target_guest_session_key: guestSessionKey,
    });

    if (result.error) {
      console.error("Failed to load guest AI conversations", result.error);
      workspaceError =
        "The AI assistant shell is live, but guest conversation continuity could not be loaded right now.";
    } else {
      conversations = (result.data ?? []) as AiConversationRpcRecord[];
    }
  }

  const requestedConversationId = params.conversationId;
  const selectedConversation = requestedConversationId
    ? conversations.find((conversation) => conversation.id === requestedConversationId) ?? null
    : conversations[0] ?? null;
  const currentConversationId = selectedConversation?.id ?? null;
  const conversationMissing = Boolean(requestedConversationId && !selectedConversation);

  let messages: (AiMessageRecord | AiMessageRpcRecord)[] = [];

  if (selectedConversation) {
    if (viewer.status === "authenticated") {
      const result = await supabase
        .from("ai_messages")
        .select("id, role, content, citations, created_at")
        .eq("conversation_id", selectedConversation.id)
        .order("created_at", { ascending: true });

      if (result.error) {
        console.error("Failed to load signed-in AI messages", result.error);
        workspaceError =
          workspaceError ??
          "The AI assistant loaded the selected thread, but its message history could not be verified.";
      } else {
        messages = (result.data ?? []) as AiMessageRecord[];
      }
    } else if (guestSessionKey) {
      const result = await supabase.rpc("list_guest_ai_messages", {
        target_conversation_id: selectedConversation.id,
        target_guest_session_key: guestSessionKey,
      });

      if (result.error) {
        console.error("Failed to load guest AI messages", result.error);
        workspaceError =
          workspaceError ??
          "The AI assistant loaded the selected guest thread, but its message history could not be verified.";
      } else {
        messages = (result.data ?? []) as AiMessageRpcRecord[];
      }
    }
  }

  const conversationSummaries = conversations.map((record) =>
    mapConversationSummary({
      activeConversationId: currentConversationId,
      record,
    }),
  );

  return {
    badges: [
      {
        label:
          viewer.status === "authenticated"
            ? "Signed-in continuity"
            : "Public discovery",
        tone: viewer.status === "authenticated" ? "blue" : "green",
      },
      {
        label:
          conversationSummaries.length > 0
            ? `${conversationSummaries.length} Saved Thread${
                conversationSummaries.length === 1 ? "" : "s"
              }`
            : "No Saved Threads Yet",
        tone: conversationSummaries.length > 0 ? "teal" : "gold",
      },
      {
        label: "Grounded Citations",
        tone: "teal",
      },
    ],
    canCreateDraftFromConversation:
      viewer.status === "authenticated" &&
      viewer.isVerifiedMember &&
      Boolean(currentConversationId) &&
      messages.some((message) => message.role === "assistant"),
    composerDisabled: false,
    composerInitialPrompt: params.prompt,
    conversationMissing,
    conversations: conversationSummaries,
    currentConversationId,
    currentConversationTitle: selectedConversation?.title ?? "NASQ AI Assistant",
    draftAssistHint:
      viewer.status !== "authenticated"
        ? null
        : !viewer.isVerifiedMember
          ? "Verified membership is required before you can turn a saved AI thread into a challenge draft."
          : currentConversationId
            ? "Create an editable challenge draft from this grounded conversation."
            : "Start or select a saved thread to unlock AI-to-draft assist.",
    emptyStateCopy:
      viewer.status === "authenticated"
        ? "Ask about published sectors, challenges, or reusable solutions to start a private grounded thread."
        : "Ask a discovery question to start a grounded public thread on this device.",
    messages: messages.map((message) =>
      mapMessageItem({
        message,
        viewerInitials: viewer.initials,
      }),
    ),
    statusMessage: conversationMissing
      ? "That AI conversation could not be found. Start a new thread or choose another saved conversation."
      : getAiConversationStatusMessage(params.status),
    suggestedPrompts: aiSuggestedPrompts,
    viewerModeLabel:
      viewer.status === "authenticated" ? "Signed-in continuity" : "Public discovery",
    viewerStatusText:
      viewer.status === "authenticated"
        ? "Signed in — private continuity active"
        : guestSessionKey
          ? "Guest continuity active on this device"
          : "Open to the public — no sign-in required",
    workspaceError,
  };
}
