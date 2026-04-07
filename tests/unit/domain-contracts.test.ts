import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  aiConversationScopes,
  aiMessageRoles,
  analyticsActorKinds,
  analyticsResourceKinds,
  challengeAnonymityModes,
  challengeDraftStatuses,
  challengeStatuses,
  coreEntityCatalog,
  membershipRoles,
  membershipVerificationStatuses,
  platformRoles,
  relayParticipantRoles,
  relayThreadStatuses,
  requiredSectorNames,
  solutionAccessModels,
  solutionStatuses,
} from "@/domain/contracts";

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/20260406110000_t04_core_schema.sql",
);

function extractCreateTableSection(sql: string, tableName: string) {
  const expression = new RegExp(
    `create table public\\.${tableName} \\(([^]*?)\\n\\);`,
    "i",
  );
  const match = sql.match(expression);

  if (!match) {
    throw new Error(`Missing create table statement for ${tableName}.`);
  }

  return match[1];
}

describe("domain contracts", () => {
  it("tracks the validated core entity catalog without overloading records", () => {
    expect(coreEntityCatalog).toEqual({
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
    });
  });

  it("locks the lifecycle and access enums required by moderation and relay flows", () => {
    expect(platformRoles).toEqual(["member", "admin"]);
    expect(membershipRoles).toEqual(["member", "company_admin"]);
    expect(membershipVerificationStatuses).toEqual([
      "pending",
      "verified",
      "suspended",
    ]);
    expect(challengeAnonymityModes).toEqual(["named", "anonymous"]);
    expect(challengeDraftStatuses).toEqual(["draft", "submitted", "archived"]);
    expect(challengeStatuses).toEqual([
      "pending_review",
      "published",
      "rejected",
      "archived",
    ]);
    expect(solutionAccessModels).toEqual(["free", "paid", "contact"]);
    expect(solutionStatuses).toEqual([
      "published",
      "under_review",
      "hidden",
      "archived",
    ]);
    expect(relayParticipantRoles).toEqual([
      "challenge_owner",
      "responder",
      "admin",
    ]);
    expect(relayThreadStatuses).toEqual(["open", "closed", "archived"]);
    expect(aiConversationScopes).toEqual(["public", "member_private"]);
    expect(aiMessageRoles).toEqual(["system", "user", "assistant"]);
    expect(analyticsActorKinds).toEqual([
      "anonymous",
      "authenticated",
      "system",
    ]);
    expect(analyticsResourceKinds).toEqual([
      "platform",
      "challenge",
      "solution",
      "sector",
      "company_profile",
      "ai_conversation",
    ]);
  });

  it("captures the governed sector taxonomy that later seeds must materialize", () => {
    expect(requiredSectorNames).toEqual([
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
    ]);
  });

  it("materializes the migration with every planned table and profile sync trigger", () => {
    const migrationSql = readFileSync(migrationPath, "utf8");

    for (const tableName of Object.values(coreEntityCatalog)) {
      expect(migrationSql).toContain(`create table public.${tableName}`);
    }

    expect(migrationSql).toContain("create function public.handle_new_user()");
    expect(migrationSql).toContain(
      "create function public.handle_auth_user_updated()",
    );
    expect(migrationSql).toContain("create function public.set_updated_at()");
    expect(migrationSql).toContain("create trigger on_auth_user_created");
    expect(migrationSql).toContain("create trigger on_auth_user_updated");

    const analyticsEventsSection = extractCreateTableSection(
      migrationSql,
      "analytics_events",
    );
    const votesSection = extractCreateTableSection(migrationSql, "votes");

    expect(analyticsEventsSection).not.toContain("updated_at");
    expect(votesSection).toContain("solution_id");
  });
});
