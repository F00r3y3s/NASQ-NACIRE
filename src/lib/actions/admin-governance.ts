"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import type { AnalyticsResourceKind, MembershipVerificationStatus } from "@/domain/contracts";
import {
  initialChallengeModerationActionState,
  initialCompanyGovernanceActionState,
  initialSectorGovernanceActionState,
  initialSolutionModerationActionState,
  normalizeChallengeModerationInput,
  normalizeCompanyGovernanceInput,
  normalizeMembershipGovernanceInput,
  normalizeSectorGovernanceInput,
  normalizeSolutionModerationInput,
  validateChallengeModerationInput,
  validateCompanyGovernanceInput,
  validateLinkCreationInput,
  validateMembershipGovernanceInput,
  validateSectorGovernanceInput,
  validateSolutionModerationInput,
  type AdminActionState,
} from "@/lib/admin/governance";
import type { ViewerContext } from "@/lib/auth/access";
import { getCurrentViewer } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ChallengeActionState = typeof initialChallengeModerationActionState;
type SolutionActionState = typeof initialSolutionModerationActionState;
type SectorActionState = typeof initialSectorGovernanceActionState;
type CompanyActionState = typeof initialCompanyGovernanceActionState;

type ChallengeModerationRecord = {
  id: string;
  published_at: string | null;
  slug: string;
  status: "archived" | "pending_review" | "published" | "rejected";
  title: string;
};

type SolutionModerationRecord = {
  id: string;
  published_at: string;
  slug: string;
  status: "archived" | "hidden" | "published" | "under_review";
  title: string;
};

type SectorRecord = {
  id: string;
  name: string;
  slug: string;
};

type CompanyRecord = {
  id: string;
  name: string;
  slug: string;
};

type MembershipRecord = {
  company_id: string;
  id: string;
  user_id: string;
  verification_status: MembershipVerificationStatus;
};

type LinkCandidateRecord = {
  id: string;
  slug: string;
  title: string;
};

type LinkRecord = {
  challenge_id: string;
  id: string;
  solution_id: string;
};

function readFormText(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function readFormBoolean(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "on" || value === "1";
}

async function requireAdminViewer() {
  const viewer = await getCurrentViewer();

  if (!viewer.isAdmin || !viewer.userId) {
    throw new Error("Admin access is required.");
  }

  return viewer as ViewerContext & { isAdmin: true; userId: string };
}

async function insertGovernanceEvent({
  actionLabel,
  eventName,
  resourceId,
  resourceKind,
  route,
  supabase,
  targetLabel,
  userId,
}: {
  actionLabel: string;
  eventName: string;
  resourceId: string | null;
  resourceKind: AnalyticsResourceKind;
  route: string;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  targetLabel: string;
  userId: string;
}) {
  const result = await supabase.from("analytics_events").insert({
    actor_kind: "authenticated",
    actor_user_id: userId,
    event_name: eventName,
    payload: {
      action_label: actionLabel,
      actor_label: "Admin",
      target_label: targetLabel,
    },
    resource_id: resourceId,
    resource_kind: resourceKind,
    route,
  });

  if (result.error) {
    throw result.error;
  }
}

function applyCommonPublicRevalidation() {
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/challenges");
  revalidatePath("/solutions");
  revalidatePath("/ai");
}

async function loadChallengeModerationRecord(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  challengeId: string,
) {
  const result = await supabase
    .from("challenges")
    .select("id, slug, status, published_at, title")
    .eq("id", challengeId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as ChallengeModerationRecord | null) ?? null;
}

async function loadSolutionModerationRecord(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  solutionId: string,
) {
  const result = await supabase
    .from("solutions")
    .select("id, slug, status, published_at, title")
    .eq("id", solutionId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as SolutionModerationRecord | null) ?? null;
}

async function loadSectorRecord(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  sectorId: string,
) {
  const result = await supabase
    .from("sectors")
    .select("id, name, slug")
    .eq("id", sectorId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as SectorRecord | null) ?? null;
}

async function loadCompanyRecord(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>,
  companyId: string,
) {
  const result = await supabase
    .from("company_profiles")
    .select("id, name, slug")
    .eq("id", companyId)
    .maybeSingle();

  if (result.error) {
    return null;
  }

  return (result.data as CompanyRecord | null) ?? null;
}

function applyUniquenessError<FieldName extends string>(
  state: AdminActionState<FieldName>,
  field: FieldName,
  message: string,
) {
  return {
    ...state,
    fieldErrors: {
      ...state.fieldErrors,
      [field]: message,
    },
  };
}

export async function submitChallengeModerationAction(
  _previousState: ChallengeActionState,
  formData: FormData,
): Promise<ChallengeActionState> {
  const input = normalizeChallengeModerationInput({
    challengeId: readFormText(formData, "challengeId"),
    reviewNotes: readFormText(formData, "reviewNotes"),
    status: readFormText(formData, "status"),
  });
  const validation = validateChallengeModerationInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    return validation;
  }

  try {
    const viewer = await requireAdminViewer();
    const supabase = await getSupabaseServerClient();
    const currentRecord = await loadChallengeModerationRecord(supabase, input.challengeId);

    if (!currentRecord) {
      return {
        fieldErrors: {},
        formError: "That challenge record could not be found anymore.",
      };
    }

    const reviewedAt = new Date().toISOString();
    const updateResult = await supabase
      .from("challenges")
      .update({
        published_at:
          input.status === "published"
            ? currentRecord.published_at ?? reviewedAt
            : null,
        review_notes: input.reviewNotes || null,
        reviewed_at: reviewedAt,
        reviewed_by_user_id: viewer.userId,
        status: input.status,
      })
      .eq("id", currentRecord.id);

    if (updateResult.error) {
      return {
        fieldErrors: {},
        formError: "The challenge moderation decision could not be saved right now.",
      };
    }

    await insertGovernanceEvent({
      actionLabel:
        input.status === "published"
          ? "Challenge approved"
          : input.status === "rejected"
            ? "Challenge rejected"
            : "Challenge archived",
      eventName: "admin_challenge_status_changed",
      resourceId: currentRecord.id,
      resourceKind: "challenge",
      route: "/admin/moderation",
      supabase,
      targetLabel: currentRecord.title,
      userId: viewer.userId,
    });

    applyCommonPublicRevalidation();
    revalidatePath("/admin/moderation");
    revalidatePath("/account/challenges");
    revalidatePath(`/challenges/${currentRecord.slug}`);
    redirect(
      `/admin/moderation?challenge=${currentRecord.id}&status=challenge-reviewed`,
    );
  } catch (error) {
    unstable_rethrow(error);

    return {
      fieldErrors: {},
      formError: "The challenge moderation action failed. Please try again.",
    };
  }
}

export async function submitSolutionModerationAction(
  _previousState: SolutionActionState,
  formData: FormData,
): Promise<SolutionActionState> {
  const input = normalizeSolutionModerationInput({
    reviewNotes: readFormText(formData, "reviewNotes"),
    solutionId: readFormText(formData, "solutionId"),
    status: readFormText(formData, "status"),
  });
  const validation = validateSolutionModerationInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    return validation;
  }

  try {
    const viewer = await requireAdminViewer();
    const supabase = await getSupabaseServerClient();
    const currentRecord = await loadSolutionModerationRecord(supabase, input.solutionId);

    if (!currentRecord) {
      return {
        fieldErrors: {},
        formError: "That solution record could not be found anymore.",
      };
    }

    const reviewedAt = new Date().toISOString();
    const updateResult = await supabase
      .from("solutions")
      .update({
        review_notes: input.reviewNotes || null,
        reviewed_at: reviewedAt,
        reviewed_by_user_id: viewer.userId,
        status: input.status,
      })
      .eq("id", currentRecord.id);

    if (updateResult.error) {
      return {
        fieldErrors: {},
        formError: "The solution override could not be saved right now.",
      };
    }

    await insertGovernanceEvent({
      actionLabel:
        input.status === "published"
          ? "Solution approved"
          : input.status === "under_review"
            ? "Solution moved under review"
            : input.status === "hidden"
              ? "Solution hidden"
              : "Solution archived",
      eventName: "admin_solution_status_changed",
      resourceId: currentRecord.id,
      resourceKind: "solution",
      route: "/admin/moderation",
      supabase,
      targetLabel: currentRecord.title,
      userId: viewer.userId,
    });

    applyCommonPublicRevalidation();
    revalidatePath("/admin/moderation");
    revalidatePath("/account/solutions");
    revalidatePath(`/solutions/${currentRecord.slug}`);
    redirect(
      `/admin/moderation?solution=${currentRecord.id}&status=solution-reviewed`,
    );
  } catch (error) {
    unstable_rethrow(error);

    return {
      fieldErrors: {},
      formError: "The solution moderation action failed. Please try again.",
    };
  }
}

export async function submitSectorGovernanceAction(
  _previousState: SectorActionState,
  formData: FormData,
): Promise<SectorActionState> {
  const input = normalizeSectorGovernanceInput({
    description: readFormText(formData, "description"),
    displayOrder: readFormText(formData, "displayOrder"),
    iconKey: readFormText(formData, "iconKey"),
    id: readFormText(formData, "sectorId"),
    isVisible: readFormBoolean(formData, "isVisible"),
    name: readFormText(formData, "name"),
    slug: readFormText(formData, "slug"),
  });
  const validation = validateSectorGovernanceInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    return validation;
  }

  try {
    const viewer = await requireAdminViewer();
    const supabase = await getSupabaseServerClient();
    const mutation = {
      description: input.description,
      display_order: Number.parseInt(input.displayOrder, 10),
      icon_key: input.iconKey || null,
      is_visible: input.isVisible,
      name: input.name,
      slug: input.slug,
    };

    if (input.id) {
      const existingRecord = await loadSectorRecord(supabase, input.id);

      if (!existingRecord) {
        return {
          fieldErrors: {},
          formError: "That governed sector could not be found anymore.",
        };
      }

      const updateResult = await supabase
        .from("sectors")
        .update(mutation)
        .eq("id", existingRecord.id);

      if (updateResult.error) {
        if (updateResult.error.code === "23505") {
          const duplicateField = updateResult.error.message.includes("name")
            ? "name"
            : "slug";

          return applyUniquenessError(
            { fieldErrors: {} },
            duplicateField,
            `That ${duplicateField} is already in use by another governed sector.`,
          );
        }

        return {
          fieldErrors: {},
          formError: "The governed sector could not be updated right now.",
        };
      }

      await insertGovernanceEvent({
        actionLabel: "Sector updated",
        eventName: "admin_sector_updated",
        resourceId: existingRecord.id,
        resourceKind: "sector",
        route: "/admin/sectors",
        supabase,
        targetLabel: input.name,
        userId: viewer.userId,
      });

      applyCommonPublicRevalidation();
      revalidatePath("/admin/sectors");
      revalidatePath("/submit");
      revalidatePath("/account/solutions");
      redirect(`/admin/sectors?sector=${existingRecord.id}&status=sector-updated`);
    }

    const insertResult = await supabase
      .from("sectors")
      .insert(mutation)
      .select("id")
      .single();

    if (insertResult.error) {
      if (insertResult.error.code === "23505") {
        const duplicateField = insertResult.error.message.includes("name")
          ? "name"
          : "slug";

        return applyUniquenessError(
          { fieldErrors: {} },
          duplicateField,
          `That ${duplicateField} is already in use by another governed sector.`,
        );
      }

      return {
        fieldErrors: {},
        formError: "The new governed sector could not be created right now.",
      };
    }

    const createdSectorId = (insertResult.data as { id: string }).id;

    await insertGovernanceEvent({
      actionLabel: "Sector created",
      eventName: "admin_sector_created",
      resourceId: createdSectorId,
      resourceKind: "sector",
      route: "/admin/sectors",
      supabase,
      targetLabel: input.name,
      userId: viewer.userId,
    });

    applyCommonPublicRevalidation();
    revalidatePath("/admin/sectors");
    revalidatePath("/submit");
    revalidatePath("/account/solutions");
    redirect(`/admin/sectors?sector=${createdSectorId}&status=sector-created`);
  } catch (error) {
    unstable_rethrow(error);

    return {
      fieldErrors: {},
      formError: "The sector governance action failed. Please try again.",
    };
  }
}

export async function submitCompanyGovernanceAction(
  _previousState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const input = normalizeCompanyGovernanceInput({
    city: readFormText(formData, "city"),
    countryCode: readFormText(formData, "countryCode"),
    description: readFormText(formData, "description"),
    headquartersLabel: readFormText(formData, "headquartersLabel"),
    id: readFormText(formData, "companyId"),
    isPublic: readFormBoolean(formData, "isPublic"),
    name: readFormText(formData, "name"),
    slug: readFormText(formData, "slug"),
    websiteUrl: readFormText(formData, "websiteUrl"),
  });
  const validation = validateCompanyGovernanceInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    return validation;
  }

  try {
    const viewer = await requireAdminViewer();
    const supabase = await getSupabaseServerClient();
    const currentRecord = await loadCompanyRecord(supabase, input.id);

    if (!currentRecord) {
      return {
        fieldErrors: {},
        formError: "That company profile could not be found anymore.",
      };
    }

    const updateResult = await supabase
      .from("company_profiles")
      .update({
        city: input.city || null,
        country_code: input.countryCode || null,
        description: input.description || null,
        headquarters_label: input.headquartersLabel || null,
        is_public: input.isPublic,
        name: input.name,
        slug: input.slug,
        website_url: input.websiteUrl || null,
      })
      .eq("id", currentRecord.id);

    if (updateResult.error) {
      if (updateResult.error.code === "23505") {
        return applyUniquenessError(
          { fieldErrors: {} },
          "slug",
          "That company slug is already in use by another profile.",
        );
      }

      return {
        fieldErrors: {},
        formError: "The company governance update could not be saved right now.",
      };
    }

    await insertGovernanceEvent({
      actionLabel: "Company profile updated",
      eventName: "admin_company_updated",
      resourceId: currentRecord.id,
      resourceKind: "company_profile",
      route: "/admin/companies",
      supabase,
      targetLabel: input.name,
      userId: viewer.userId,
    });

    applyCommonPublicRevalidation();
    revalidatePath("/admin/companies");
    revalidatePath("/account");
    revalidatePath("/account/challenges");
    revalidatePath("/account/solutions");
    redirect(`/admin/companies?company=${currentRecord.id}&status=company-updated`);
  } catch (error) {
    unstable_rethrow(error);

    return {
      fieldErrors: {},
      formError: "The company governance action failed. Please try again.",
    };
  }
}

export async function submitMembershipGovernanceAction(formData: FormData) {
  const input = normalizeMembershipGovernanceInput({
    companyId: readFormText(formData, "companyId"),
    isPrimary: readFormBoolean(formData, "isPrimary"),
    membershipId: readFormText(formData, "membershipId"),
    verificationStatus: readFormText(formData, "verificationStatus"),
  });
  const validation = validateMembershipGovernanceInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    redirect(`/admin/companies?company=${input.companyId}`);
  }

  const viewer = await requireAdminViewer();
  const supabase = await getSupabaseServerClient();
  const membershipResult = await supabase
    .from("memberships")
    .select("id, user_id, company_id, verification_status")
    .eq("id", input.membershipId)
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (membershipResult.error || !membershipResult.data) {
    redirect(`/admin/companies?company=${input.companyId}`);
  }

  const membership = membershipResult.data as MembershipRecord;
  const verifiedAt =
    input.verificationStatus === "verified" ? new Date().toISOString() : null;
  const suspendedAt =
    input.verificationStatus === "suspended" ? new Date().toISOString() : null;
  const isPrimary = input.isPrimary && input.verificationStatus === "verified";

  if (isPrimary) {
    await supabase
      .from("memberships")
      .update({ is_primary: false })
      .eq("user_id", membership.user_id);
  }

  const updateResult = await supabase
    .from("memberships")
    .update({
      is_primary: isPrimary,
      suspended_at: suspendedAt,
      verification_status: input.verificationStatus,
      verified_at: verifiedAt,
    })
    .eq("id", membership.id);

  if (!updateResult.error) {
    await insertGovernanceEvent({
      actionLabel: "Membership trust updated",
      eventName: "admin_membership_updated",
      resourceId: membership.company_id,
      resourceKind: "company_profile",
      route: "/admin/companies",
      supabase,
      targetLabel: `Membership ${membership.id}`,
      userId: viewer.userId,
    });
  }

  revalidatePath("/admin/companies");
  redirect(`/admin/companies?company=${input.companyId}&status=membership-updated`);
}

export async function createChallengeSolutionLinkAction(formData: FormData) {
  const input = {
    challengeId: readFormText(formData, "challengeId"),
    solutionId: readFormText(formData, "solutionId"),
  };
  const validation = validateLinkCreationInput(input);

  if (Object.keys(validation.fieldErrors).length > 0) {
    redirect("/admin/links");
  }

  const viewer = await requireAdminViewer();
  const supabase = await getSupabaseServerClient();
  const [challengeResult, solutionResult] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, title, slug")
      .eq("id", input.challengeId)
      .eq("status", "published")
      .maybeSingle(),
    supabase
      .from("solutions")
      .select("id, title, slug")
      .eq("id", input.solutionId)
      .eq("status", "published")
      .maybeSingle(),
  ]);

  if (
    challengeResult.error ||
    solutionResult.error ||
    !challengeResult.data ||
    !solutionResult.data
  ) {
    redirect("/admin/links");
  }

  const challenge = challengeResult.data as LinkCandidateRecord;
  const solution = solutionResult.data as LinkCandidateRecord;
  const insertResult = await supabase.from("challenge_solution_links").insert({
    challenge_id: challenge.id,
    linked_by_user_id: viewer.userId,
    solution_id: solution.id,
  });

  if (insertResult.error) {
    redirect("/admin/links");
  }

  await insertGovernanceEvent({
    actionLabel: "Link created",
    eventName: "admin_link_created",
    resourceId: challenge.id,
    resourceKind: "challenge",
    route: "/admin/links",
    supabase,
    targetLabel: `${challenge.title} ↔ ${solution.title}`,
    userId: viewer.userId,
  });

  applyCommonPublicRevalidation();
  revalidatePath("/admin/links");
  revalidatePath(`/challenges/${challenge.slug}`);
  revalidatePath(`/solutions/${solution.slug}`);
  redirect("/admin/links?status=link-created");
}

export async function deleteChallengeSolutionLinkAction(formData: FormData) {
  const linkId = readFormText(formData, "linkId");

  if (!linkId) {
    redirect("/admin/links");
  }

  const viewer = await requireAdminViewer();
  const supabase = await getSupabaseServerClient();
  const linkResult = await supabase
    .from("challenge_solution_links")
    .select("id, challenge_id, solution_id")
    .eq("id", linkId)
    .maybeSingle();

  if (linkResult.error || !linkResult.data) {
    redirect("/admin/links");
  }

  const link = linkResult.data as LinkRecord;
  const [challengeResult, solutionResult] = await Promise.all([
    supabase
      .from("challenges")
      .select("id, title, slug")
      .eq("id", link.challenge_id)
      .maybeSingle(),
    supabase
      .from("solutions")
      .select("id, title, slug")
      .eq("id", link.solution_id)
      .maybeSingle(),
  ]);

  const deleteResult = await supabase
    .from("challenge_solution_links")
    .delete()
    .eq("id", link.id);

  if (!deleteResult.error) {
    await insertGovernanceEvent({
      actionLabel: "Link deleted",
      eventName: "admin_link_deleted",
      resourceId: link.challenge_id,
      resourceKind: "challenge",
      route: "/admin/links",
      supabase,
      targetLabel: `${challengeResult.data?.title ?? "Challenge"} ↔ ${solutionResult.data?.title ?? "Solution"}`,
      userId: viewer.userId,
    });
  }

  applyCommonPublicRevalidation();
  revalidatePath("/admin/links");
  if (challengeResult.data?.slug) {
    revalidatePath(`/challenges/${challengeResult.data.slug}`);
  }
  if (solutionResult.data?.slug) {
    revalidatePath(`/solutions/${solutionResult.data.slug}`);
  }
  redirect("/admin/links?status=link-deleted");
}
