import type {
  AIConversationScope,
  AIMessageRole,
  AnalyticsActorKind,
  AnalyticsResourceKind,
  ChallengeAnonymityMode,
  ChallengeDraftStatus,
  ChallengeStatus,
  MembershipRole,
  MembershipVerificationStatus,
  PlatformRole,
  RelayParticipantRole,
  RelayThreadStatus,
  SolutionAccessModel,
  SolutionStatus,
} from "@/domain/contracts";

export type UUID = string;
export type ISODateTimeString = string;

export type JsonPrimitive = boolean | null | number | string;
export type JsonValue = JsonObject | JsonPrimitive | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface User {
  id: UUID;
  email: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  platformRole: PlatformRole;
  locale: string | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CompanyProfile {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  headquartersLabel: string | null;
  countryCode: string | null;
  city: string | null;
  logoPath: string | null;
  isPublic: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Membership {
  id: UUID;
  userId: UUID;
  companyId: UUID;
  role: MembershipRole;
  verificationStatus: MembershipVerificationStatus;
  isPrimary: boolean;
  verifiedAt: ISODateTimeString | null;
  suspendedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Sector {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  displayOrder: number;
  isVisible: boolean;
  iconKey: string | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Challenge {
  id: UUID;
  slug: string;
  ownerMembershipId: UUID;
  companyId: UUID;
  sectorId: UUID;
  title: string;
  summary: string;
  problemStatement: string;
  desiredOutcome: string | null;
  geographyLabel: string | null;
  anonymityMode: ChallengeAnonymityMode;
  status: ChallengeStatus;
  reviewNotes: string | null;
  reviewedByUserId: UUID | null;
  reviewedAt: ISODateTimeString | null;
  publishedAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ChallengeDraft {
  id: UUID;
  ownerMembershipId: UUID;
  sectorId: UUID | null;
  sourceConversationId: UUID | null;
  submittedChallengeId: UUID | null;
  title: string | null;
  summary: string | null;
  problemStatement: string | null;
  desiredOutcome: string | null;
  geographyLabel: string | null;
  anonymityMode: ChallengeAnonymityMode;
  status: ChallengeDraftStatus;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Solution {
  id: UUID;
  slug: string;
  ownerMembershipId: UUID;
  companyId: UUID;
  sectorId: UUID;
  title: string;
  summary: string;
  offeringDescription: string;
  coverageLabel: string | null;
  accessModel: SolutionAccessModel;
  status: SolutionStatus;
  reviewNotes: string | null;
  reviewedByUserId: UUID | null;
  reviewedAt: ISODateTimeString | null;
  publishedAt: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ChallengeSolutionLink {
  id: UUID;
  challengeId: UUID;
  solutionId: UUID;
  linkedByUserId: UUID | null;
  createdAt: ISODateTimeString;
}

export interface RelayThread {
  id: UUID;
  challengeId: UUID;
  challengeOwnerMembershipId: UUID;
  responderMembershipId: UUID;
  solutionId: UUID | null;
  status: RelayThreadStatus;
  lastMessageAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface RelayMessage {
  id: UUID;
  threadId: UUID;
  senderUserId: UUID;
  senderMembershipId: UUID | null;
  senderRole: RelayParticipantRole;
  body: string;
  readAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
}

export interface Vote {
  id: UUID;
  solutionId: UUID;
  voterUserId: UUID;
  createdAt: ISODateTimeString;
}

export interface AIConversation {
  id: UUID;
  ownerUserId: UUID | null;
  guestSessionKey: string | null;
  title: string | null;
  accessScope: AIConversationScope;
  lastMessageAt: ISODateTimeString | null;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface AIMessageCitation {
  href: string;
  label: string;
  recordId: UUID;
  recordType: "challenge" | "solution";
}

export interface AIMessage {
  id: UUID;
  conversationId: UUID;
  role: AIMessageRole;
  content: string;
  citations: AIMessageCitation[];
  createdAt: ISODateTimeString;
}

export interface AnalyticsEvent {
  id: UUID;
  actorKind: AnalyticsActorKind;
  actorUserId: UUID | null;
  companyId: UUID | null;
  resourceKind: AnalyticsResourceKind;
  resourceId: UUID | null;
  route: string | null;
  eventName: string;
  payload: JsonObject;
  occurredAt: ISODateTimeString;
}
