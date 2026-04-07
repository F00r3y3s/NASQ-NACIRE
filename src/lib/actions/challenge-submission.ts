"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment } from "@/config/env";
import { getCurrentViewer } from "@/lib/auth/server";
import {
  buildChallengeDraftMutation,
  buildChallengeInsertMutation,
  createChallengeSlug,
  hasChallengeSubmissionErrors,
  initialChallengeSubmissionActionState,
  normalizeChallengeSubmissionInput,
  resolveChallengeSubmissionIntent,
  selectChallengeSubmissionMembership,
  validateChallengeSubmission,
  type ChallengeSubmissionActionState,
} from "@/lib/challenges/submission";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ChallengeDraftRecord = {
  id: string;
  status: "draft" | "submitted" | "archived";
  submitted_challenge_id: string | null;
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

async function ensureValidSector(supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>, sectorId: string) {
  const result = await supabase
    .from("public_sectors")
    .select("id")
    .eq("id", sectorId)
    .maybeSingle();

  return Boolean(result.data) && !result.error;
}

async function loadExistingDraft(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  draftId: string,
) {
  const result = await supabase
    .from("challenge_drafts")
    .select("id, status, submitted_challenge_id")
    .eq("id", draftId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as ChallengeDraftRecord | null) ?? null;
}

function createRandomSlugSuffix() {
  return crypto.randomUUID().split("-")[0]!;
}

async function createPendingReviewChallenge({
  companyId,
  input,
  ownerMembershipId,
  supabase,
}: {
  companyId: string;
  input: ReturnType<typeof normalizeChallengeSubmissionInput>;
  ownerMembershipId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const baseSlug = createChallengeSlug(input.title);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug =
      attempt === 0 ? baseSlug : `${baseSlug}-${createRandomSlugSuffix()}`;
    const result = await supabase
      .from("challenges")
      .insert(
        buildChallengeInsertMutation({
          companyId,
          input,
          ownerMembershipId,
          slug,
        }),
      )
      .select("id")
      .single();

    if (!result.error) {
      return result.data as { id: string };
    }

    const isDuplicateSlug =
      result.error.code === "23505" &&
      result.error.message.toLowerCase().includes("slug");

    if (!isDuplicateSlug) {
      throw result.error;
    }
  }

  throw new Error("Unable to generate a unique challenge slug.");
}

export async function submitChallengeEditorAction(
  _previousState: ChallengeSubmissionActionState,
  formData: FormData,
): Promise<ChallengeSubmissionActionState> {
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return {
      fieldErrors: {},
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable challenge submission.",
    };
  }

  const viewer = await getCurrentViewer();
  const membership = selectChallengeSubmissionMembership(viewer.memberships);

  if (!membership?.company) {
    return {
      fieldErrors: {},
      formError:
        "A verified company membership is required before you can save or submit a challenge.",
    };
  }

  const input = normalizeChallengeSubmissionInput({
    anonymityMode: readFormText(formData, "anonymityMode"),
    desiredOutcome: readFormText(formData, "desiredOutcome"),
    draftId: readFormText(formData, "draftId"),
    geographyLabel: readFormText(formData, "geographyLabel"),
    problemStatement: readFormText(formData, "problemStatement"),
    sectorId: readFormText(formData, "sectorId"),
    sourceConversationId: readFormText(formData, "sourceConversationId"),
    summary: readFormText(formData, "summary"),
    title: readFormText(formData, "title"),
  });
  const intent = resolveChallengeSubmissionIntent(readFormText(formData, "intent"));
  const validation = validateChallengeSubmission(input, intent);

  if (hasChallengeSubmissionErrors(validation)) {
    return validation;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const isValidSector = input.sectorId
      ? await ensureValidSector(supabase, input.sectorId)
      : true;

    if (!isValidSector) {
      return {
        fieldErrors: {
          sectorId: "Select a valid governed sector.",
        },
        formError: "The selected sector is no longer available.",
      };
    }

    const existingDraft = input.draftId ? await loadExistingDraft(supabase, input.draftId) : null;

    if (input.draftId && !existingDraft) {
      return {
        fieldErrors: {},
        formError: "That draft could not be found anymore. Start a new one from the submit page.",
      };
    }

    if (existingDraft?.status === "submitted") {
      return {
        fieldErrors: {},
        formError:
          "This draft has already been submitted for review and can no longer be edited.",
      };
    }

    if (intent === "save_draft") {
      const payload = buildChallengeDraftMutation({
        input,
        ownerMembershipId: membership.id,
        status: "draft",
      });
      const result = existingDraft
        ? await supabase
            .from("challenge_drafts")
            .update(payload)
            .eq("id", existingDraft.id)
            .select("id")
            .single()
        : await supabase
            .from("challenge_drafts")
            .insert(payload)
            .select("id")
            .single();

      if (result.error) {
        return {
          fieldErrors: {},
          formError: "We couldn't save the draft just now. Please try again.",
        };
      }

      const savedDraftId = (result.data as { id: string }).id;

      revalidatePath("/submit");
      revalidatePath(`/drafts/${savedDraftId}`);
      redirect(`/drafts/${savedDraftId}?status=draft-saved`);
    }

    let draftId = existingDraft?.id ?? null;

    if (!draftId) {
      const createdDraftResult = await supabase
        .from("challenge_drafts")
        .insert(
          buildChallengeDraftMutation({
            input,
            ownerMembershipId: membership.id,
            status: "draft",
          }),
        )
        .select("id")
        .single();

      if (createdDraftResult.error) {
        return {
          fieldErrors: {},
          formError:
            "We couldn't create a draft snapshot before submission. Please try again.",
        };
      }

      draftId = (createdDraftResult.data as { id: string }).id;
    }

    const challenge = await createPendingReviewChallenge({
      companyId: membership.companyId,
      input,
      ownerMembershipId: membership.id,
      supabase,
    });

    const finalizeDraftResult = await supabase
      .from("challenge_drafts")
      .update(
        buildChallengeDraftMutation({
          input,
          ownerMembershipId: membership.id,
          status: "submitted",
          submittedChallengeId: challenge.id,
        }),
      )
      .eq("id", draftId)
      .select("id")
      .single();

    if (finalizeDraftResult.error) {
      return {
        fieldErrors: {},
        formError:
          "Your challenge was submitted, but the draft snapshot could not be finalized. Please reopen your draft or contact support.",
      };
    }

    revalidatePath("/submit");
    revalidatePath(`/drafts/${draftId}`);
    revalidatePath("/admin/moderation");
    revalidatePath("/account/challenges");
    redirect(`/drafts/${draftId}?status=submitted`);
  } catch (error) {
    unstable_rethrow(error);
    console.error("Challenge submission action failed", error);

    return {
      fieldErrors: {},
      formError:
        "We couldn't process that request right now. Please review the form and try again.",
    };
  }

  return initialChallengeSubmissionActionState;
}
