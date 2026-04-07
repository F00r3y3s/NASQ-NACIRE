"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { readSupabasePublicEnvironment, resolveEnvironmentStatus } from "@/config/env";
import {
  initialMembershipOnboardingActionState,
  normalizeMembershipOnboardingInput,
  validateMembershipOnboardingInput,
  type MembershipOnboardingActionState,
  type MembershipOnboardingFieldErrors,
} from "@/lib/auth/onboarding";
import { getCurrentViewer } from "@/lib/auth/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

import { buildAuthHref, resolvePostAuthPath, type AuthMode } from "./navigation";
import type { AuthActionState, AuthFieldErrors } from "./state";
import { initialAuthActionState } from "./state";

function getSingleValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeMode(value: string): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

function createState(
  current: Pick<AuthActionState, "defaultValues" | "mode">,
  updates: Partial<AuthActionState>,
): AuthActionState {
  return {
    ...initialAuthActionState,
    ...current,
    ...updates,
    defaultValues: {
      ...initialAuthActionState.defaultValues,
      ...current.defaultValues,
      ...updates.defaultValues,
    },
    fieldErrors: {
      ...updates.fieldErrors,
    },
  };
}

function createMembershipOnboardingState(
  current: Pick<MembershipOnboardingActionState, "defaultValues">,
  updates: Partial<MembershipOnboardingActionState>,
): MembershipOnboardingActionState {
  return {
    ...initialMembershipOnboardingActionState,
    ...current,
    ...updates,
    defaultValues: {
      ...initialMembershipOnboardingActionState.defaultValues,
      ...current.defaultValues,
      ...updates.defaultValues,
    },
    fieldErrors: {
      ...(updates.fieldErrors ?? {}),
    },
  };
}

function applyAuthProviderError(
  current: Pick<AuthActionState, "defaultValues" | "mode">,
  error: { code?: string; message: string } | null,
) {
  if (!error) {
    return createState(current, {
      formError:
        current.mode === "signup"
          ? "We could not create that account right now. Try a different email address or retry in a moment."
          : "We could not sign you in with those credentials. Check your email and password, then try again.",
    });
  }

  if (error.code === "email_address_invalid") {
    return createState(current, {
      fieldErrors: {
        email: "Enter a valid email address.",
      },
      formError: "Enter a valid work email address so we can create your account.",
    });
  }

  if (error.code === "email_not_confirmed") {
    return createState(current, {
      formError:
        "Confirm your email address from the verification email, then sign in to continue.",
    });
  }

  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return createState(current, {
      formError:
        "An account already exists for that email address. Sign in instead, or reset the password if needed.",
    });
  }

  if (error.code === "over_email_send_rate_limit") {
    return createState(current, {
      formError:
        "Too many verification emails were requested recently. Wait a moment, then try again.",
    });
  }

  return createState(current, {
    formError:
      current.mode === "signup"
        ? error.message || "We could not create that account right now. Try again in a moment."
        : error.message ||
          "We could not sign you in with those credentials. Check your email and password, then try again.",
  });
}

function applyMembershipOnboardingError(
  current: Pick<MembershipOnboardingActionState, "defaultValues">,
  error: { code?: string; message: string } | null,
) {
  const message = error?.message?.toLowerCase() ?? "";

  if (error?.code === "23505" || message.includes("company_profiles_slug_key")) {
    const fieldErrors: MembershipOnboardingFieldErrors = {
      companySlug: "That company slug is already in use. Choose a more specific company slug.",
    };

    return createMembershipOnboardingState(current, {
      fieldErrors,
      formError:
        "This company slug is already taken. Update the slug and resend the verification request.",
    });
  }

  if (message.includes("already has a company membership")) {
    return createMembershipOnboardingState(current, {
      formError:
        "This account already has a linked company membership or a pending verification request.",
    });
  }

  return createMembershipOnboardingState(current, {
    formError:
      "The company verification request could not be created right now. Please retry in a moment.",
  });
}

export async function submitAuthAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const mode = normalizeMode(getSingleValue(formData.get("intent")));
  const defaultValues = {
    email: getSingleValue(formData.get("email")),
    firstName: getSingleValue(formData.get("firstName")),
    lastName: getSingleValue(formData.get("lastName")),
    next: resolvePostAuthPath(getSingleValue(formData.get("next")), "/account"),
  };
  const password = getSingleValue(formData.get("password"));
  const current = {
    defaultValues,
    mode,
  };

  if (!readSupabasePublicEnvironment()) {
    return createState(current, {
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable account access.",
    });
  }

  const fieldErrors: AuthFieldErrors = {};

  if (!defaultValues.email) {
    fieldErrors.email = "Enter your work email to continue.";
  } else if (!isValidEmail(defaultValues.email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Enter your password to continue.";
  } else if (password.length < 8) {
    fieldErrors.password = "Use at least 8 characters.";
  }

  if (mode === "signup") {
    if (!defaultValues.firstName) {
      fieldErrors.firstName = "Enter your first name.";
    }

    if (!defaultValues.lastName) {
      fieldErrors.lastName = "Enter your last name.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createState(current, {
      fieldErrors,
      formError:
        mode === "signup"
          ? "Complete the required account fields before creating your access."
          : "Enter a valid email and password to sign in.",
    });
  }

  const redirectPath = resolvePostAuthPath(defaultValues.next, "/account");
  const appUrl = resolveEnvironmentStatus().appUrl;
  const supabase = await getSupabaseServerClient();

  try {
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: defaultValues.email,
        password,
      });

      if (error) {
        return applyAuthProviderError(current, error);
      }

      revalidatePath("/", "layout");
      redirect(redirectPath as Route);
    }

    const displayName = [defaultValues.firstName, defaultValues.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const { data, error } = await supabase.auth.signUp({
      email: defaultValues.email,
      options: {
        data: {
          display_name: displayName,
          first_name: defaultValues.firstName,
          last_name: defaultValues.lastName,
        },
        emailRedirectTo: `${appUrl}/auth`,
      },
      password,
    });

    if (error) {
      return applyAuthProviderError(current, error);
    }

    revalidatePath("/", "layout");

    if (data.session) {
      redirect(redirectPath as Route);
    }

    redirect(`${buildAuthHref(redirectPath, "signin")}&status=check-email` as Route);
  } catch (error) {
    unstable_rethrow(error);

    return createState(current, {
      formError:
        "The account request could not be completed right now. Please retry in a moment.",
    });
  }
}

export async function submitMembershipOnboardingAction(
  _state: MembershipOnboardingActionState,
  formData: FormData,
): Promise<MembershipOnboardingActionState> {
  const defaultValues = normalizeMembershipOnboardingInput({
    city: getSingleValue(formData.get("city")),
    companyName: getSingleValue(formData.get("companyName")),
    companySlug: getSingleValue(formData.get("companySlug")),
    countryCode: getSingleValue(formData.get("countryCode")),
    description: getSingleValue(formData.get("description")),
    headquartersLabel: getSingleValue(formData.get("headquartersLabel")),
    websiteUrl: getSingleValue(formData.get("websiteUrl")),
  });
  const current = {
    defaultValues,
  };

  if (!readSupabasePublicEnvironment()) {
    return createMembershipOnboardingState(current, {
      formError:
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before enabling onboarding.",
    });
  }

  const fieldErrors = validateMembershipOnboardingInput(defaultValues);

  if (Object.keys(fieldErrors).length > 0) {
    return createMembershipOnboardingState(current, {
      fieldErrors,
      formError:
        "Complete the required company details before sending a verification request.",
    });
  }

  const viewer = await getCurrentViewer();

  if (viewer.status !== "authenticated") {
    redirect(buildAuthHref("/account", "signin") as Route);
  }

  if (viewer.memberships.length > 0) {
    return createMembershipOnboardingState(current, {
      formError:
        "This account already has a linked company membership or a pending verification request.",
    });
  }

  const supabase = await getSupabaseServerClient();

  try {
    const { error } = await supabase.rpc("request_company_membership", {
      city: defaultValues.city || null,
      company_description: defaultValues.description || null,
      company_name: defaultValues.companyName,
      company_slug: defaultValues.companySlug,
      country_code: defaultValues.countryCode || null,
      headquarters_label: defaultValues.headquartersLabel || null,
      website_url: defaultValues.websiteUrl || null,
    });

    if (error) {
      return applyMembershipOnboardingError(current, error);
    }

    revalidatePath("/", "layout");
    revalidatePath("/account");
    redirect("/account?status=verification-requested");
  } catch (error) {
    unstable_rethrow(error);

    return createMembershipOnboardingState(current, {
      formError:
        "The company verification request could not be completed right now. Please retry in a moment.",
    });
  }
}

export async function signOutAction() {
  if (!readSupabasePublicEnvironment()) {
    redirect("/");
  }

  const supabase = await getSupabaseServerClient();

  try {
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/auth?status=signed-out");
  } catch (error) {
    unstable_rethrow(error);
    redirect("/");
  }
}
