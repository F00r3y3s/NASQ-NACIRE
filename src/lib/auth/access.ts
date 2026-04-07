import type { AppRoute } from "@/config/routes";
import { matchPlannedRoute } from "@/config/routes";
import type { CompanyProfile, Membership, User } from "@/domain/models";
import { buildProtectedAuthRedirect } from "@/lib/auth/navigation";

export const accessRequirements = [
  "public",
  "authenticated",
  "verified_member",
  "admin",
] as const;

export type AccessRequirement = (typeof accessRequirements)[number];

type ViewerStatus = "anonymous" | "authenticated";

type ViewerAuthUser = {
  email: string | null;
  id: string;
  userMetadata?: {
    avatar_url?: string | null;
    display_name?: string | null;
    first_name?: string | null;
    full_name?: string | null;
    last_name?: string | null;
  } | null;
};

export type ViewerCompanySummary = Pick<
  CompanyProfile,
  "headquartersLabel" | "id" | "isPublic" | "logoPath" | "name" | "slug"
>;

export type ViewerMembershipSummary = Pick<
  Membership,
  "companyId" | "id" | "isPrimary" | "role" | "verificationStatus" | "verifiedAt"
> & {
  company: ViewerCompanySummary | null;
};

export type ViewerContext = {
  authConfigured: boolean;
  avatarUrl: string | null;
  displayName: string;
  email: string | null;
  initials: string;
  isAdmin: boolean;
  isVerifiedMember: boolean;
  memberships: ViewerMembershipSummary[];
  platformRole: User["platformRole"] | null;
  primaryCompany: ViewerCompanySummary | null;
  status: ViewerStatus;
  userId: string | null;
};

type BuildViewerContextInput = {
  authConfigured: boolean;
  authUser: ViewerAuthUser | null;
  companies: CompanyProfile[];
  memberships: Membership[];
  profile: User | null;
};

type RouteAccessDecision = {
  allowed: boolean;
  matchedRoute: AppRoute | null;
  reason: "allowed" | "needs_admin" | "needs_authentication" | "needs_verified_member";
  redirectTo: string | null;
  requirement: AccessRequirement | null;
};

const routeAccessPolicies: Record<AppRoute, AccessRequirement> = {
  "/": "public",
  "/account": "authenticated",
  "/account/challenges": "authenticated",
  "/account/solutions": "authenticated",
  "/admin/companies": "admin",
  "/admin/links": "admin",
  "/admin/moderation": "admin",
  "/admin/sectors": "admin",
  "/ai": "public",
  "/analytics": "public",
  "/challenges": "public",
  "/challenges/[slug]": "public",
  "/drafts/[id]": "verified_member",
  "/solutions": "public",
  "/solutions/[slug]": "public",
  "/submit": "verified_member",
} as const;

function toCompanySummary(company: CompanyProfile): ViewerCompanySummary {
  return {
    headquartersLabel: company.headquartersLabel,
    id: company.id,
    isPublic: company.isPublic,
    logoPath: company.logoPath,
    name: company.name,
    slug: company.slug,
  };
}

function resolveDisplayName(profile: User | null, authUser: ViewerAuthUser) {
  const profileFullName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const metadata = authUser.userMetadata ?? null;
  const metadataFullName = [metadata?.first_name, metadata?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    profile?.displayName ||
    profileFullName ||
    metadata?.display_name ||
    metadata?.full_name ||
    metadataFullName ||
    authUser.email?.split("@")[0] ||
    "Member"
  );
}

function resolveAvatarUrl(profile: User | null, authUser: ViewerAuthUser) {
  return profile?.avatarUrl || authUser.userMetadata?.avatar_url || null;
}

function getInitials(value: string) {
  const tokens = value.trim().split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return "NA";
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }

  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
}

function selectPrimaryMembership(memberships: ViewerMembershipSummary[]) {
  return (
    memberships.find((membership) => membership.isPrimary) ||
    memberships.find((membership) => membership.verificationStatus === "verified") ||
    memberships[0] ||
    null
  );
}

function createViewerMemberships(
  memberships: Membership[],
  companies: CompanyProfile[],
): ViewerMembershipSummary[] {
  const companiesById = new Map(companies.map((company) => [company.id, company]));

  return memberships.map((membership) => ({
    company: companiesById.has(membership.companyId)
      ? toCompanySummary(companiesById.get(membership.companyId)!)
      : null,
    companyId: membership.companyId,
    id: membership.id,
    isPrimary: membership.isPrimary,
    role: membership.role,
    verificationStatus: membership.verificationStatus,
    verifiedAt: membership.verifiedAt,
  }));
}

export function createAnonymousViewer({
  authConfigured,
}: {
  authConfigured: boolean;
}): ViewerContext {
  return {
    authConfigured,
    avatarUrl: null,
    displayName: "Guest",
    email: null,
    initials: "GU",
    isAdmin: false,
    isVerifiedMember: false,
    memberships: [],
    platformRole: null,
    primaryCompany: null,
    status: "anonymous",
    userId: null,
  };
}

export function buildViewerContext({
  authConfigured,
  authUser,
  companies,
  memberships,
  profile,
}: BuildViewerContextInput): ViewerContext {
  if (!authUser) {
    return createAnonymousViewer({ authConfigured });
  }

  const viewerMemberships = createViewerMemberships(memberships, companies);
  const primaryMembership = selectPrimaryMembership(viewerMemberships);
  const displayName = resolveDisplayName(profile, authUser);
  const isAdmin = profile?.platformRole === "admin";
  const isVerifiedMember =
    isAdmin ||
    viewerMemberships.some((membership) => membership.verificationStatus === "verified");

  return {
    authConfigured,
    avatarUrl: resolveAvatarUrl(profile, authUser),
    displayName,
    email: profile?.email || authUser.email,
    initials: getInitials(displayName),
    isAdmin,
    isVerifiedMember,
    memberships: viewerMemberships,
    platformRole: profile?.platformRole ?? null,
    primaryCompany: primaryMembership?.company ?? null,
    status: "authenticated",
    userId: authUser.id,
  };
}

export function resolveAccessRequirement(pathname: string): AccessRequirement | null {
  const matchedRoute = matchPlannedRoute(pathname);

  return matchedRoute ? routeAccessPolicies[matchedRoute] : null;
}

export function evaluateRouteAccess(
  viewer: ViewerContext,
  pathname: string,
): RouteAccessDecision {
  const matchedRoute = matchPlannedRoute(pathname);

  if (!matchedRoute) {
    return {
      allowed: true,
      matchedRoute: null,
      reason: "allowed",
      redirectTo: null,
      requirement: null,
    };
  }

  const requirement = routeAccessPolicies[matchedRoute];

  if (requirement === "public") {
    return {
      allowed: true,
      matchedRoute,
      reason: "allowed",
      redirectTo: null,
      requirement,
    };
  }

  if (requirement === "authenticated") {
    const allowed = viewer.status === "authenticated";

    return {
      allowed,
      matchedRoute,
      reason: allowed ? "allowed" : "needs_authentication",
      redirectTo: allowed ? null : buildProtectedAuthRedirect(pathname),
      requirement,
    };
  }

  if (requirement === "verified_member") {
    if (viewer.status !== "authenticated") {
      return {
        allowed: false,
        matchedRoute,
        reason: "needs_authentication",
        redirectTo: buildProtectedAuthRedirect(pathname),
        requirement,
      };
    }

    return {
      allowed: viewer.isVerifiedMember || viewer.isAdmin,
      matchedRoute,
      reason:
        viewer.isVerifiedMember || viewer.isAdmin
          ? "allowed"
          : "needs_verified_member",
      redirectTo: viewer.isVerifiedMember || viewer.isAdmin ? null : "/account",
      requirement,
    };
  }

  if (viewer.status !== "authenticated") {
    return {
      allowed: false,
      matchedRoute,
      reason: "needs_authentication",
      redirectTo: buildProtectedAuthRedirect(pathname),
      requirement,
    };
  }

  return {
    allowed: viewer.isAdmin,
    matchedRoute,
    reason: viewer.isAdmin ? "allowed" : "needs_admin",
    redirectTo: viewer.isAdmin ? null : "/account",
    requirement,
  };
}
