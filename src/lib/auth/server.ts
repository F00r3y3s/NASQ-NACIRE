import { cache } from "react";

import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { Route } from "next";
import { redirect } from "next/navigation";

import type { MembershipRole, MembershipVerificationStatus, PlatformRole } from "@/domain/contracts";
import type { CompanyProfile, Membership, User } from "@/domain/models";
import { readSupabasePublicEnvironment } from "@/config/env";
import { buildViewerContext, createAnonymousViewer, evaluateRouteAccess } from "@/lib/auth/access";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRecord = {
  avatar_url: string | null;
  created_at: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  id: string;
  last_name: string | null;
  locale: string | null;
  platform_role: PlatformRole;
  updated_at: string;
};

type MembershipRecord = {
  company_id: string;
  created_at: string;
  id: string;
  is_primary: boolean;
  role: MembershipRole;
  suspended_at: string | null;
  updated_at: string;
  user_id: string;
  verification_status: MembershipVerificationStatus;
  verified_at: string | null;
};

type CompanyProfileRecord = {
  city: string | null;
  country_code: string | null;
  created_at: string;
  description: string | null;
  headquarters_label: string | null;
  id: string;
  is_public: boolean;
  logo_path: string | null;
  name: string;
  slug: string;
  updated_at: string;
  website_url: string | null;
};

function mapProfileRecord(record: ProfileRecord): User {
  return {
    avatarUrl: record.avatar_url,
    createdAt: record.created_at,
    displayName: record.display_name,
    email: record.email,
    firstName: record.first_name,
    id: record.id,
    lastName: record.last_name,
    locale: record.locale,
    platformRole: record.platform_role,
    updatedAt: record.updated_at,
  };
}

function mapMembershipRecord(record: MembershipRecord): Membership {
  return {
    companyId: record.company_id,
    createdAt: record.created_at,
    id: record.id,
    isPrimary: record.is_primary,
    role: record.role,
    suspendedAt: record.suspended_at,
    updatedAt: record.updated_at,
    userId: record.user_id,
    verificationStatus: record.verification_status,
    verifiedAt: record.verified_at,
  };
}

function mapCompanyProfileRecord(record: CompanyProfileRecord): CompanyProfile {
  return {
    city: record.city,
    countryCode: record.country_code,
    createdAt: record.created_at,
    description: record.description,
    headquartersLabel: record.headquarters_label,
    id: record.id,
    isPublic: record.is_public,
    logoPath: record.logo_path,
    name: record.name,
    slug: record.slug,
    updatedAt: record.updated_at,
    websiteUrl: record.website_url,
  };
}

function mapAuthUser(user: SupabaseAuthUser) {
  return {
    email: user.email ?? null,
    id: user.id,
    userMetadata: {
      avatar_url:
        typeof user.user_metadata?.avatar_url === "string"
          ? user.user_metadata.avatar_url
          : null,
      display_name:
        typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name
          : null,
      first_name:
        typeof user.user_metadata?.first_name === "string"
          ? user.user_metadata.first_name
          : null,
      full_name:
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null,
      last_name:
        typeof user.user_metadata?.last_name === "string"
          ? user.user_metadata.last_name
          : null,
    },
  };
}

export const getCurrentViewer = cache(async () => {
  const env = readSupabasePublicEnvironment();

  if (!env) {
    return createAnonymousViewer({ authConfigured: false });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createAnonymousViewer({ authConfigured: true });
  }

  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, display_name, first_name, last_name, avatar_url, platform_role, locale, created_at, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select(
        "id, user_id, company_id, role, verification_status, is_primary, verified_at, suspended_at, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileResult.data
    ? mapProfileRecord(profileResult.data as ProfileRecord)
    : null;
  const memberships = (membershipsResult.data ?? []).map((record) =>
    mapMembershipRecord(record as MembershipRecord),
  );

  const companyIds = [...new Set(memberships.map((membership) => membership.companyId))];
  let companies: CompanyProfile[] = [];

  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("company_profiles")
      .select(
        "id, slug, name, description, website_url, headquarters_label, country_code, city, logo_path, is_public, created_at, updated_at",
      )
      .in("id", companyIds)
      .order("name", { ascending: true });

    companies = (data ?? []).map((record) =>
      mapCompanyProfileRecord(record as CompanyProfileRecord),
    );
  }

  return buildViewerContext({
    authConfigured: true,
    authUser: mapAuthUser(user),
    companies,
    memberships,
    profile,
  });
});

export async function requireRouteAccess(pathname: string) {
  const viewer = await getCurrentViewer();
  const decision = evaluateRouteAccess(viewer, pathname);

  if (!decision.allowed) {
    redirect((decision.redirectTo ?? "/") as Route);
  }

  return viewer;
}
