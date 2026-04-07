"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment } from "@/config/env";
import { publicReadModelCatalog } from "@/domain/public-records";
import { getCurrentViewer } from "@/lib/auth/server";
import { selectVerifiedContributionMembership } from "@/lib/contributions/memberships";
import {
  buildChallengeSolutionLinkInsertRows,
  buildSolutionInsertMutation,
  buildSolutionUpdateMutation,
  createSolutionSlug,
  hasSolutionAuthoringErrors,
  initialSolutionAuthoringActionState,
  normalizeSolutionAuthoringInput,
  validateSolutionAuthoring,
  type SolutionAuthoringActionState,
} from "@/lib/solutions/authoring";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ExistingSolutionRecord = {
  company_id: string;
  id: string;
  owner_membership_id: string;
  slug: string;
  status: "published" | "under_review" | "hidden" | "archived";
};

type ChallengeValidationRow = {
  id: string;
  slug: string;
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readFormTextList(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

async function ensureValidSector(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  sectorId: string,
) {
  const result = await supabase
    .from(publicReadModelCatalog.publicSectors)
    .select("id")
    .eq("id", sectorId)
    .maybeSingle();

  return Boolean(result.data) && !result.error;
}

async function loadExistingSolution(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  solutionId: string,
) {
  const result = await supabase
    .from("solutions")
    .select("id, slug, owner_membership_id, company_id, status")
    .eq("id", solutionId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as ExistingSolutionRecord | null) ?? null;
}

async function loadValidatedChallenges(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  challengeIds: string[],
) {
  if (challengeIds.length === 0) {
    return [];
  }

  const result = await supabase
    .from(publicReadModelCatalog.publicChallenges)
    .select("id, slug")
    .in("id", challengeIds);

  if (result.error) {
    return null;
  }

  return (result.data as ChallengeValidationRow[]) ?? [];
}

function createRandomSlugSuffix() {
  return crypto.randomUUID().split("-")[0]!;
}

async function createPublishedSolution({
  companyId,
  input,
  ownerMembershipId,
  supabase,
}: {
  companyId: string;
  input: ReturnType<typeof normalizeSolutionAuthoringInput>;
  ownerMembershipId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const baseSlug = createSolutionSlug(input.title);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${createRandomSlugSuffix()}`;
    const result = await supabase
      .from("solutions")
      .insert(
        buildSolutionInsertMutation({
          companyId,
          input,
          ownerMembershipId,
          slug,
        }),
      )
      .select("id, slug")
      .single();

    if (!result.error) {
      return result.data as { id: string; slug: string };
    }

    const isDuplicateSlug =
      result.error.code === "23505" &&
      result.error.message.toLowerCase().includes("slug");

    if (!isDuplicateSlug) {
      throw result.error;
    }
  }

  throw new Error("Unable to generate a unique solution slug.");
}

async function syncSolutionChallengeLinks({
  challengeIds,
  linkedByUserId,
  solutionId,
  supabase,
}: {
  challengeIds: string[];
  linkedByUserId: string | null;
  solutionId: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
}) {
  const existingLinksResult = await supabase
    .from("challenge_solution_links")
    .select("challenge_id")
    .eq("solution_id", solutionId);

  if (existingLinksResult.error) {
    throw existingLinksResult.error;
  }

  const existingChallengeIds = new Set(
    ((existingLinksResult.data ?? []) as { challenge_id: string }[]).map(
      (row) => row.challenge_id,
    ),
  );
  const nextChallengeIds = new Set(challengeIds);
  const challengeIdsToDelete = [...existingChallengeIds].filter(
    (challengeId) => !nextChallengeIds.has(challengeId),
  );
  const challengeIdsToInsert = [...nextChallengeIds].filter(
    (challengeId) => !existingChallengeIds.has(challengeId),
  );

  if (challengeIdsToDelete.length > 0) {
    const deleteResult = await supabase
      .from("challenge_solution_links")
      .delete()
      .eq("solution_id", solutionId)
      .in("challenge_id", challengeIdsToDelete);

    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  if (challengeIdsToInsert.length > 0) {
    const insertResult = await supabase
      .from("challenge_solution_links")
      .insert(
        buildChallengeSolutionLinkInsertRows({
          challengeIds: challengeIdsToInsert,
          linkedByUserId,
          solutionId,
        }),
      );

    if (insertResult.error) {
      throw insertResult.error;
    }
  }
}

export async function submitSolutionAuthoringAction(
  _previousState: SolutionAuthoringActionState,
  formData: FormData,
): Promise<SolutionAuthoringActionState> {
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return {
      fieldErrors: {},
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable solution publishing.",
    };
  }

  const viewer = await getCurrentViewer();
  const input = normalizeSolutionAuthoringInput({
    accessModel: readFormText(formData, "accessModel"),
    coverageLabel: readFormText(formData, "coverageLabel"),
    linkedChallengeIds: readFormTextList(formData, "linkedChallengeIds"),
    offeringDescription: readFormText(formData, "offeringDescription"),
    sectorId: readFormText(formData, "sectorId"),
    solutionId: readFormText(formData, "solutionId"),
    summary: readFormText(formData, "summary"),
    title: readFormText(formData, "title"),
  });
  const validation = validateSolutionAuthoring(input);

  if (hasSolutionAuthoringErrors(validation)) {
    return validation;
  }

  try {
    const supabase = await getSupabaseServerClient();
    const isValidSector = await ensureValidSector(supabase, input.sectorId);

    if (!isValidSector) {
      return {
        fieldErrors: {
          sectorId: "Select a valid governed sector.",
        },
        formError: "The selected sector is no longer available.",
      };
    }

    const validatedChallenges = await loadValidatedChallenges(
      supabase,
      input.linkedChallengeIds,
    );

    if (validatedChallenges === null) {
      return {
        fieldErrors: {
          linkedChallengeIds:
            "We couldn't verify the selected challenge links right now.",
        },
        formError: "Please try again before publishing the solution.",
      };
    }

    if (validatedChallenges.length !== input.linkedChallengeIds.length) {
      return {
        fieldErrors: {
          linkedChallengeIds:
            "One or more selected challenges are no longer available for linking.",
        },
        formError: "Update the linked challenges and try again.",
      };
    }

    if (input.solutionId) {
      const existingSolution = await loadExistingSolution(supabase, input.solutionId);

      if (!existingSolution) {
        return {
          fieldErrors: {},
          formError:
            "That solution could not be found anymore. Start a new record from the workspace.",
        };
      }

      if (existingSolution.status === "archived") {
        return {
          fieldErrors: {},
          formError: "Archived solutions are locked and can no longer be edited.",
        };
      }

      const updateResult = await supabase
        .from("solutions")
        .update(
          buildSolutionUpdateMutation({
            input,
          }),
        )
        .eq("id", existingSolution.id)
        .select("id, slug")
        .single();

      if (updateResult.error) {
        return {
          fieldErrors: {},
          formError: "We couldn't save the solution changes just now. Please try again.",
        };
      }

      await syncSolutionChallengeLinks({
        challengeIds: validatedChallenges.map((challenge) => challenge.id),
        linkedByUserId: viewer.userId,
        solutionId: existingSolution.id,
        supabase,
      });

      revalidatePath("/");
      revalidatePath("/challenges");
      revalidatePath("/solutions");
      revalidatePath("/account/solutions");
      revalidatePath(`/solutions/${existingSolution.slug}`);

      for (const challenge of validatedChallenges) {
        revalidatePath(`/challenges/${challenge.slug}`);
      }

      redirect(`/account/solutions?solution=${existingSolution.id}&status=updated`);
    }

    const membership = selectVerifiedContributionMembership(viewer.memberships);

    if (!membership?.company) {
      return {
        fieldErrors: {},
        formError:
          "A verified company membership is required before you can publish a solution.",
      };
    }

    const solution = await createPublishedSolution({
      companyId: membership.companyId,
      input,
      ownerMembershipId: membership.id,
      supabase,
    });

    if (validatedChallenges.length > 0) {
      const linksResult = await supabase
        .from("challenge_solution_links")
        .insert(
          buildChallengeSolutionLinkInsertRows({
            challengeIds: validatedChallenges.map((challenge) => challenge.id),
            linkedByUserId: viewer.userId,
            solutionId: solution.id,
          }),
        );

      if (linksResult.error) {
        return {
          fieldErrors: {
            linkedChallengeIds:
              "The solution published, but the challenge links could not be saved. Please reopen the record and try again.",
          },
          formError:
            "Solution published, but the selected challenge links still need to be retried.",
        };
      }
    }

    revalidatePath("/");
    revalidatePath("/challenges");
    revalidatePath("/solutions");
    revalidatePath("/account/solutions");
    revalidatePath(`/solutions/${solution.slug}`);

    for (const challenge of validatedChallenges) {
      revalidatePath(`/challenges/${challenge.slug}`);
    }

    redirect(`/account/solutions?solution=${solution.id}&status=published`);
  } catch (error) {
    unstable_rethrow(error);

    return {
      fieldErrors: {},
      formError:
        "We couldn't publish the solution right now. Please review the fields and try again.",
    };
  }

  return initialSolutionAuthoringActionState;
}
