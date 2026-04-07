export const coreEntityCatalog = {
  aiConversation: "ai_conversations",
  aiMessage: "ai_messages",
  analyticsEvent: "analytics_events",
  challenge: "challenges",
  challengeDraft: "challenge_drafts",
  challengeSolutionLink: "challenge_solution_links",
  companyProfile: "company_profiles",
  membership: "memberships",
  relayMessage: "relay_messages",
  relayThread: "relay_threads",
  sector: "sectors",
  solution: "solutions",
  user: "profiles",
  vote: "votes",
} as const;

export type CoreEntityName = keyof typeof coreEntityCatalog;
export type CoreTableName = (typeof coreEntityCatalog)[CoreEntityName];

export const platformRoles = ["member", "admin"] as const;
export type PlatformRole = (typeof platformRoles)[number];

export const membershipRoles = ["member", "company_admin"] as const;
export type MembershipRole = (typeof membershipRoles)[number];

export const membershipVerificationStatuses = [
  "pending",
  "verified",
  "suspended",
] as const;
export type MembershipVerificationStatus =
  (typeof membershipVerificationStatuses)[number];

export const challengeAnonymityModes = ["named", "anonymous"] as const;
export type ChallengeAnonymityMode =
  (typeof challengeAnonymityModes)[number];

export const challengeDraftStatuses = [
  "draft",
  "submitted",
  "archived",
] as const;
export type ChallengeDraftStatus = (typeof challengeDraftStatuses)[number];

export const challengeStatuses = [
  "pending_review",
  "published",
  "rejected",
  "archived",
] as const;
export type ChallengeStatus = (typeof challengeStatuses)[number];

export const solutionAccessModels = ["free", "paid", "contact"] as const;
export type SolutionAccessModel = (typeof solutionAccessModels)[number];

export const solutionStatuses = [
  "published",
  "under_review",
  "hidden",
  "archived",
] as const;
export type SolutionStatus = (typeof solutionStatuses)[number];

export const relayParticipantRoles = [
  "challenge_owner",
  "responder",
  "admin",
] as const;
export type RelayParticipantRole = (typeof relayParticipantRoles)[number];

export const relayThreadStatuses = ["open", "closed", "archived"] as const;
export type RelayThreadStatus = (typeof relayThreadStatuses)[number];

export const aiConversationScopes = ["public", "member_private"] as const;
export type AIConversationScope = (typeof aiConversationScopes)[number];

export const aiMessageRoles = ["system", "user", "assistant"] as const;
export type AIMessageRole = (typeof aiMessageRoles)[number];

export const analyticsActorKinds = [
  "anonymous",
  "authenticated",
  "system",
] as const;
export type AnalyticsActorKind = (typeof analyticsActorKinds)[number];

export const analyticsResourceKinds = [
  "platform",
  "challenge",
  "solution",
  "sector",
  "company_profile",
  "ai_conversation",
] as const;
export type AnalyticsResourceKind = (typeof analyticsResourceKinds)[number];

export const requiredSectorNames = [
  "Oil & Gas",
  "Energy & Utilities",
  "Construction & Infrastructure",
  "Healthcare",
  "Finance & Banking",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Technology",
  "Tourism & Hospitality",
  "Education",
  "Police & Civil Defense",
  "Aviation",
  "Solar & Energy",
] as const;

export type RequiredSectorName = (typeof requiredSectorNames)[number];
