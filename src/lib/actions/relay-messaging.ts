"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import { selectVerifiedContributionMembership } from "@/lib/contributions/memberships";
import {
  buildPostRelayMessagePayload,
  buildStartRelayThreadPayload,
  initialRelayMessageActionState,
  normalizeRelayComposerInput,
  validateRelayComposerInput,
  type RelayMessageActionState,
} from "@/lib/relay/messaging";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function createRelayErrorMessage(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("not open")) {
    return "This relay thread is closed and cannot receive new messages right now.";
  }

  if (message.includes("verified membership")) {
    return "A verified company membership is required before you can use the protected relay.";
  }

  if (message.includes("cannot start a relay thread")) {
    return "This anonymous challenge is not eligible for a new relay thread from your current membership.";
  }

  if (message.includes("cannot post to this relay thread")) {
    return "You no longer have permission to post to this relay thread.";
  }

  return "We couldn't send that relay message right now. Please review the thread and try again.";
}

export async function submitRelayMessageAction(
  _previousState: RelayMessageActionState,
  formData: FormData,
): Promise<RelayMessageActionState> {
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return {
      fieldErrors: {},
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable protected relay messaging.",
    };
  }

  const viewer = await getCurrentViewer();
  const input = normalizeRelayComposerInput({
    body: readFormText(formData, "body"),
    challengeId: readFormText(formData, "challengeId"),
    challengeSlug: readFormText(formData, "challengeSlug"),
    solutionId: readFormText(formData, "solutionId"),
    threadId: readFormText(formData, "threadId"),
  });
  const validation = validateRelayComposerInput(input);

  if (validation.formError) {
    return validation;
  }

  try {
    const supabase = await getSupabaseServerClient();

    if (input.threadId) {
      const result = await supabase.rpc(
        "post_relay_message",
        buildPostRelayMessagePayload({
          body: input.body,
          threadId: input.threadId,
        }),
      );

      if (result.error) {
        return {
          fieldErrors: {},
          formError: createRelayErrorMessage(result.error),
        };
      }

      revalidatePath("/account/challenges");
      redirect(`/account/challenges?thread=${input.threadId}&status=message_sent`);
    }

    const membership = selectVerifiedContributionMembership(viewer.memberships);

    if (!membership) {
      return {
        fieldErrors: {},
        formError:
          "A verified company membership is required before you can respond through the protected relay.",
      };
    }

    const result = await supabase.rpc(
      "start_relay_thread",
      buildStartRelayThreadPayload({
        body: input.body,
        challengeId: input.challengeId,
        responderMembershipId: membership.id,
        solutionId: input.solutionId,
      }),
    );

    if (result.error || typeof result.data !== "string") {
      return {
        fieldErrors: {},
        formError: createRelayErrorMessage(result.error),
      };
    }

    revalidatePath("/account/challenges");
    revalidatePath(`/challenges/${input.challengeSlug}`);
    redirect(`/account/challenges?thread=${result.data}&status=relay_started`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Relay messaging action failed", error);

    return {
      fieldErrors: {},
      formError:
        "We couldn't process that relay message right now. Please review the workspace and try again.",
    };
  }

  return initialRelayMessageActionState;
}
