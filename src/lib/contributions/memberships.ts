import type { ViewerMembershipSummary } from "@/lib/auth/access";

export function selectVerifiedContributionMembership(
  memberships: ViewerMembershipSummary[],
) {
  return (
    memberships.find(
      (membership) =>
        membership.isPrimary &&
        membership.verificationStatus === "verified" &&
        membership.company,
    ) ||
    memberships.find(
      (membership) =>
        membership.verificationStatus === "verified" && membership.company,
    ) ||
    null
  );
}
