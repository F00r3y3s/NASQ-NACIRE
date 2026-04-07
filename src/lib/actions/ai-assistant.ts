"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import {
  buildAiConversationTitle,
  guestAiSessionCookieName,
  initialAiPromptActionState,
  normalizeAiPromptInput,
  validateAiPromptInput,
  type AiPromptActionState,
} from "@/lib/ai/conversations";
import { generateGroundedAiTurn } from "@/lib/ai/service";
import type { AIMessageCitation } from "@/domain/models";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ExistingConversationRecord = {
  id: string;
  title: string | null;
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function createAuthenticatedConversation({
  supabase,
  title,
  userId,
}: {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  title: string;
  userId: string;
}) {
  const result = await supabase
    .from("ai_conversations")
    .insert({
      access_scope: "member_private",
      last_message_at: new Date().toISOString(),
      owner_user_id: userId,
      title,
    })
    .select("id, title")
    .single();

  if (result.error) {
    throw result.error;
  }

  return result.data as ExistingConversationRecord;
}

async function loadAuthenticatedConversation({
  conversationId,
  supabase,
}: {
  conversationId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const result = await supabase
    .from("ai_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return (result.data as ExistingConversationRecord | null) ?? null;
}

async function appendAuthenticatedMessages({
  assistantCitations,
  assistantReply,
  conversation,
  prompt,
  supabase,
  title,
}: {
  assistantCitations: AIMessageCitation[];
  assistantReply: string;
  conversation: ExistingConversationRecord;
  prompt: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  title: string;
}) {
  const insertResult = await supabase.from("ai_messages").insert([
    {
      citations: [],
      content: prompt,
      conversation_id: conversation.id,
      role: "user",
    },
    {
      citations: assistantCitations,
      content: assistantReply,
      conversation_id: conversation.id,
      role: "assistant",
    },
  ]);

  if (insertResult.error) {
    throw insertResult.error;
  }

  const updateResult = await supabase
    .from("ai_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      title: conversation.title ?? title,
    })
    .eq("id", conversation.id);

  if (updateResult.error) {
    throw updateResult.error;
  }
}

export async function submitAiPromptAction(
  _previousState: AiPromptActionState,
  formData: FormData,
): Promise<AiPromptActionState> {
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return {
      fieldErrors: {},
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable AI continuity.",
    };
  }

  const input = normalizeAiPromptInput({
    conversationId: readFormText(formData, "conversationId"),
    prompt: readFormText(formData, "prompt"),
  });
  const validation = validateAiPromptInput(input);

  if (validation.formError) {
    return validation;
  }

  const title = buildAiConversationTitle(input.prompt);
  const viewer = await getCurrentViewer();

  try {
    const supabase = await getSupabaseServerClient();
    const groundedTurn = await generateGroundedAiTurn({
      isSignedIn: viewer.status === "authenticated",
      prompt: input.prompt,
      supabase,
    });

    if (viewer.status === "authenticated" && viewer.userId) {
      const conversation = input.conversationId
        ? await loadAuthenticatedConversation({
            conversationId: input.conversationId,
            supabase,
          })
        : null;
      const activeConversation =
        conversation ??
        (await createAuthenticatedConversation({
          supabase,
          title,
          userId: viewer.userId,
        }));

      if (!activeConversation) {
        return {
          fieldErrors: {},
          formError:
            "That AI conversation could not be found in your signed-in workspace.",
        };
      }

      await appendAuthenticatedMessages({
        assistantCitations: groundedTurn.citations,
        assistantReply: groundedTurn.assistantReply,
        conversation: activeConversation,
        prompt: input.prompt,
        supabase,
        title,
      });

      revalidatePath("/ai");
      redirect(
        `/ai?conversation=${activeConversation.id}&status=${
          input.conversationId ? "message_sent" : "thread_created"
        }`,
      );
    }

    const cookieStore = await cookies();
    const guestSessionKey =
      cookieStore.get(guestAiSessionCookieName)?.value ?? crypto.randomUUID();

    cookieStore.set(guestAiSessionCookieName, guestSessionKey, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    const result = await supabase.rpc("submit_guest_ai_turn", {
      assistant_citations: groundedTurn.citations,
      assistant_content: groundedTurn.assistantReply,
      conversation_title: title,
      target_conversation_id: input.conversationId || null,
      target_guest_session_key: guestSessionKey,
      user_content: input.prompt,
    });

    if (result.error || typeof result.data !== "string") {
      return {
        fieldErrors: {},
        formError:
          "We couldn't save that public AI thread right now. Please try again.",
      };
    }

    revalidatePath("/ai");
    redirect(
      `/ai?conversation=${result.data}&status=${
        input.conversationId ? "message_sent" : "thread_created"
      }`,
    );
  } catch (error) {
    unstable_rethrow(error);
    console.error("AI assistant action failed", error);

    return {
      fieldErrors: {},
      formError:
        "We couldn't process that AI request right now. Please try again in a moment.",
    };
  }

  return initialAiPromptActionState;
}
